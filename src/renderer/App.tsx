import { storageManager } from './storeManager';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useParams,
} from 'react-router-dom';
import icon from '../../assets/icon.svg';

import MainPage from './Project/TSX/MainPage';
import { useEffect, useState } from 'react';
import NavBar from './Project/TSX/Navbar/NavBar';
import LogoImage from './assets/Insert Image Pic.png';
import loadingGif from './assets/assets/Loading/Rolling-1s-200px.gif';
import { v4 as uuidv4 } from 'uuid';
import {
  addValue,
  addValueROOM,
  deleteValue,
  getValues,
  getValuesWithSql,
  updateValue,
} from '../Backend/localServerApis';
import AccountManager from './Project/TSX/Sign up and login/AccountManager';
import {
  getValuesWithSql_Online,
  SignOutUser,
  Upload,
  UploadUserFilesToTheOnlineDatabase,
} from '../Backend/OnlineServerApis';
import {
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  isAfter,
  isBefore,
} from 'date-fns';
import { Payment } from 'electron';
import {
  GetDefaultCurrency,
  getRateByDate,
} from './Project/TSX/Helpers/CurrencySign';
import { AlertProvider, useAlert } from './components/useAlert';
import { ConfirmProvider } from './components/useConfirm';
import { getFromStore, setToStore } from './storeManager';
import { GlobalProvider, useGlobal } from './components/GlobalContext';
import CornerSupport from './Project/TSX/Helpers/CornerSupport';
function noop() {}
//console.log = noop;

declare global {}
function Hello({ tryout, username, signup }: any) {
  import('./App.css');

  const [RoomList, setRoomList] = useState<RoomType[]>([]);
  const {
    AllRoomPayInfo,
    setAllRoomPayInfo,
    AllExpenses,
    setAllExpenses,
    AllAgreements,
    setAllAgreements,
    AllTenants,
    setAllTenants,
    AllUtilityPayments,
    setAllUtilityPayments,
    AllUtilityPaymentsSettings,
    setAllUtilityPaymentsSettings,
    AllEmailTemplates,
    setAllEmailTemplates,
    AllSmsTemplates,
    setAllSmsTemplates,
    AllNotificationTemplateSelections,
    setAllNotificationTemplateSelections,
    AllRoomSpecifications,
    setAllRoomSpecifications,
    AllRoomPayInfoHistory,
    setAllRoomPayInfoHistory,
  } = useGlobal();

  const [BrokerList, setBrokerList] = useState<BrokerType[]>([]);
  const [PastTenantReviews, setPastTenantReviews] = useState<
    PastTenantReviewType[]
  >([]);
  const [isUpdatingTenantList, setIsUpdatingTenantList] = useState(false);
  const [BrokerRecommendationList, setBrokerRecommendationList] = useState<
    BrokerRecommendationType[]
  >([]);
  const getOriginlPropertyValue = (
    list: any[],
    id: string,
    propertyName: string
  ) => {
    const room = list.find((r: RoomType) => r.id === id);
    if (room) {
      const propertyValue = room[propertyName];
      return propertyValue;
    }
  };
  const calculatePredictedPayments = async (
    room: RoomType,
    AllAgreements2: any,
    AllRoomPayInfo2: any
  ) => {
    const allPayments = [];
    const today = new Date();
    const yearEnd = new Date(today.getFullYear() + 1, 11, 31);
    const tenant = AllTenants.find((t) => t.id === room.tenantId);
    let startDate = new Date(tenant?.startTime || Date.now()).getTime();

    let endDate = null;
    if (room.selectedAgreementId) {
      const agreements = AllAgreements2.filter(
        (a) => a.id === room.selectedAgreementId
      );
      if (agreements.length > 0) {
        startDate = agreements[0].startTime;
      }
      if (tenant?.SelectedAgreement === 'Fixed-Term') {
        if (agreements.length > 0) {
          endDate = agreements[0].endTime;
        }
      }
    }

    let currentDate = new Date(startDate);
    while (
      currentDate <= yearEnd &&
      (endDate == null || currentDate <= new Date(endDate))
    ) {
      const paymentId = `${room.id}-${currentDate.getTime()}`;
      allPayments.push({
        id: paymentId,
        Day: currentDate.getTime(),
        Value: room.AgreedPrice,
        Paid: false,
        roomId: room.id,
      });

      switch (room.PaymentCycleType) {
        case '30':
          currentDate = addDays(currentDate, 30);
          break;
        case '15':
          currentDate = addDays(currentDate, 15);
          break;
        case '7':
          currentDate = addDays(currentDate, 7);
          break;
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addDays(currentDate, 7);
          break;
        case 'Annually':
          currentDate = addYears(currentDate, 1);
          break;
        case 'custom':
          currentDate = addDays(
            currentDate,
            room.PaymentCycleCustomeDays || 30
          );
          break;
        default:
          currentDate = addMonths(currentDate, 1);
      }
    }

    const actualPayments = AllRoomPayInfo2.filter(
      (p) => p.roomId === room.id && p.tenantId === room.tenantId
    );

    const finalPayments = allPayments.map((payment) => {
      const actualPayment = actualPayments.find(
        (p: any) => p.id === payment.id
      );
      return actualPayment
        ? { ...payment, Paid: actualPayment.Paid === 1 }
        : payment;
    });

    if (finalPayments.length === 0) {
      console.log('No payments predicted. Possible reasons:');
      console.log('- No tenant assigned to the room');
      console.log('- No valid start date for the tenant');
      console.log('- No valid payment cycle set for the room');
      console.log('- End date is before or equal to start date');
    }

    return finalPayments;
  };

  const calculateDaysTillNextPayment = (predictedPayments: Payment[]) => {
    const today = new Date();

    const sortedPayments = predictedPayments.sort((a, b) => a.Day - b.Day);

    for (const payment of sortedPayments) {
      const paymentDate = new Date(payment.Day);
      const daysDifference = differenceInDays(paymentDate, today);

      if (!payment.Paid) {
        if (daysDifference === 0) {
          return 0;
        } else if (daysDifference < 0) {
          return daysDifference;
        } else {
          return daysDifference;
        }
      }
    }

    return -98989898;
  };
  class RoomApi {
    getRoomFromApi = async (
      AllRoomSpecifications2: any,
      AllUtilityPaymentsSettings2: any,
      AllRoomPayInfo2: any,
      AllAgreements2: any
    ) => {
      let useBranchId = storageManager.get('SelectedBranchId');
      const roomsRaw = await getValuesWithSql(
        'rooms',
        `WHERE 1 AND branchId = '${useBranchId}'`
      );
      console.log(':ROOOMS', roomsRaw);
      if (roomsRaw) {
        const rooms = await Promise.all(
          roomsRaw.map(async (room: RoomType) => {
            const roomSpecifications = AllRoomSpecifications2.filter(
              (r) => r.roomId === room.id
            );
            const utilityPayments = AllUtilityPaymentsSettings2.filter(
              (u) => u.roomId === room.id
            );
            const defaultUtilities = [
              'Security',
              'Electricity',
              'Water',
              'Generator',
              'Internet',
              'Trash Collection',
              'Parking',
              'Utility',
            ];

            const formattedUtilityPayments = defaultUtilities.map((type) => {
              const existingUtility = utilityPayments.find(
                (u) => u.type === type
              );
              return {
                type,
                useThis: existingUtility
                  ? existingUtility.useThis === 1
                  : false,
                price: existingUtility ? existingUtility.price.toString() : '',
                alwaysAsk: existingUtility
                  ? existingUtility.alwaysAsk === 1
                  : false,
                Currency: existingUtility
                  ? existingUtility.Currency
                  : GetDefaultCurrency(),
                id: existingUtility ? existingUtility.id : uuidv4(),
                userId: existingUtility ? existingUtility.userId : uuidv4(),
              };
            });

            // Calculate predicted payments
            const predictedPayments = await calculatePredictedPayments(
              room,
              AllAgreements2,
              AllRoomPayInfo2
            );

            // Calculate days till next payment
            const DaysTillNextPayment =
              calculateDaysTillNextPayment(predictedPayments);

            return {
              id: room.id,
              floor: room.floor,
              roomIndex: room.roomIndex,
              status: room.status,
              price: room.price,
              AgreedPrice: room.AgreedPrice,
              PaymentCycleType: room.PaymentCycleType,
              PaymentCycleCustomeDays: room.PaymentCycleCustomeDays,
              squareMeters: room.squareMeters,
              RoomSpecifications: roomSpecifications,
              Archived: room.Archived || false,
              tenantId: room.tenantId || '',
              AddTenantState: false,
              ViewAgreement: false,
              ShowPayTimeLine: false,
              AllRoomPayInfo: { RoomPayInfo: predictedPayments || [] },
              selectedAgreementId: room.selectedAgreementId || '',
              notificationSettings: room.notificationSettings || 0,
              utilityPaymentEvery: room.utilityPaymentEvery || '30',
              utilityPaymentStartDate: room.utilityPaymentStartDate || 0,
              utilityPaymentUseDifferentStartDate:
                room.utilityPaymentUseDifferentStartDate || false,
              utilityPaymentEveryCustom: room.utilityPaymentEveryCustom || 0,
              utilityPayments: formattedUtilityPayments || [],
              paymentShowAmount: room.paymentShowAmount || 10,
              DaysTillNextPayment: DaysTillNextPayment || 0,
              Currency: room.Currency || '',
              UtilityNotificationSettings:
                room.UtilityNotificationSettings || 0,
              useTenantPortal: room.useTenantPortal || false,
              TenantPortalShowTenantDetails:
                room.TenantPortalShowTenantDetails || false,
              TenantPortalShowReceipts: room.TenantPortalShowReceipts || false,
              TenantPortalAllowOnlinePayments:
                room.TenantPortalAllowOnlinePayments || false,
            };
          })
        );
        setRoomList(rooms);
      }
    };

    editRoomApi = async (
      roomId: string,
      propertyName: string,
      newValue: any
    ) => {
      // wrap around try catch
      try {
        await updateValue(
          'rooms',
          roomId,
          propertyName,
          newValue,
          setChangeMade,
          getOriginlPropertyValue(RoomList, roomId, propertyName)
        );

        setRoomList(
          RoomList.map((room) =>
            room.id === roomId ? { ...room, [propertyName]: newValue } : room
          )
        );
      } catch (error: any) {
        console.error(error.message);
      }
    };
    AddRoomApi = async (
      roomID: string,
      AddRoomFormFloor: number,
      AddRoomFormRoomIndex: number,
      AddRoomFormPrice: number,
      AddRoomFormPaymentCycleType: number,
      AddRoomFormPaymentCycleCustomDays: number,
      AddRoomFormSquareMeters: number,

      AddRoomFormRoomSpecifications: RoomSpecificationType[],
      AddRoomFormCurrency: string
    ) => {
      try {
        //Add room

        await addValueROOM(
          'rooms',
          {
            id: roomID || uuidv4(), // Assuming you have a uuidv4 function for generating IDs
            floor: AddRoomFormFloor || 0,
            roomIndex: AddRoomFormRoomIndex || 0,
            status: 'Empty',
            price: AddRoomFormPrice || 0,
            AgreedPrice: AddRoomFormPrice || 0,
            PaymentCycleType: AddRoomFormPaymentCycleType || 'monthly',
            paymentShowAmount: 1,
            PaymentCycleCustomeDays: AddRoomFormPaymentCycleCustomDays || 0,
            squareMeters: AddRoomFormSquareMeters || 0,
            tenantId: '',
            AddTenantState: 0,
            ViewAgreement: 0,
            ShowPayTimeLine: 0,
            selectedAgreementId: '',
            Archived: 0,
            notificationSettings: 0,
            utilityPaymentEvery: '30',
            utilityPaymentEveryCustom: 0,
            utilityPaymentStartDate: 0,
            utilityPaymentUseDifferentStartDate: 0,
            userId: SelectedUserId || '',
            branchId: SelectedBranchId,
            Currency: AddRoomFormCurrency || GetDefaultCurrency(),
          },
          setChangeMade
        );

        //Add roomspecfications
        for (let i = 0; i < AddRoomFormRoomSpecifications.length; i++) {
          const element = AddRoomFormRoomSpecifications[i];
          roomSpecificationAPI.addRoomSpecification(
            uuidv4(),
            roomID,
            element.Detail || 'false',
            element.Number || 0,
            element.type || 'number',
            element.Boolean || false
          );
        }
        setRoomList([
          ...RoomList,
          {
            id: roomID || uuidv4(),
            floor: AddRoomFormFloor || 0,
            roomIndex: AddRoomFormRoomIndex || 0,
            status: 'Empty',
            price: AddRoomFormPrice || 0,
            AgreedPrice: AddRoomFormPrice || 0,
            PaymentCycleType: AddRoomFormPaymentCycleType || 'monthly',
            PaymentCycleCustomeDays: AddRoomFormPaymentCycleCustomDays || 0,
            squareMeters: AddRoomFormSquareMeters || 0,
            tenantId: '',
            AddTenantState: false,
            ViewAgreement: false,
            ShowPayTimeLine: false,
            selectedAgreementId: '',
            Archived: false,
            notificationSettings: 0,
            utilityPaymentEvery: '30',
            utilityPaymentEveryCustom: 0,
            utilityPaymentStartDate: 0,
            utilityPaymentUseDifferentStartDate: false,
            userId: SelectedUserId || '',
            branchId: SelectedBranchId,
            Currency: AddRoomFormCurrency || GetDefaultCurrency(),
            RoomSpecifications: AddRoomFormRoomSpecifications,
            paymentShowAmount: 1,
            DaysTillNextPayment: 0,
            UtilityNotificationSettings: 0,
            useTenantPortal: false,
            TenantPortalShowTenantDetails: false,
            TenantPortalShowReceipts: false,
            TenantPortalAllowOnlinePayments: false,
          },
        ]);
      } catch (error: any) {
        console.error(error.message);
      }
    };
    DeleteRoom = async (roomId: string) => {
      try {
        await deleteValue('rooms', roomId, setChangeMade);
        setRoomList(RoomList.filter((r: RoomType) => r.id !== roomId));
      } catch (error: any) {
        console.log(error.message);
      }
    };
    RemoveTenant = async (roomId: string) => {
      try {
        await deleteValue('rooms', roomId);
        setRoomList(RoomList.filter((r: RoomType) => r.id !== roomId));
        /* Delete All room specifications */
      } catch (error: any) {
        console.log(error.message);
      }
    };
  }
  class RoomSpecificationApi {
    getRoomSpecificationApi = async (roomID: string) => {
      const roomSpecificationsRaw = AllRoomSpecifications.filter(
        (roomSpecification) => roomSpecification.roomId === roomID
      );
      if (roomSpecificationsRaw) {
        return roomSpecificationsRaw.map(
          (roomSpecification: RoomSpecificationType) => {
            return {
              id: roomSpecification.id,
              Detail: roomSpecification.Detail,
              Number: roomSpecification.Number,
              type: roomSpecification.type,
              Boolean: roomSpecification.Boolean,
            };
          }
        );
      }
    };
    addRoomSpecification = async (
      id: string,
      roomId: string,

      Detail: string,
      Number: number,
      type: string,
      Boolean: boolean
    ) => {
      try {
        addValue(
          'room_specifications',
          {
            id: id,
            roomId: roomId,
            Detail: Detail,
            Number: Number,
            type: type,
            Boolean: Boolean,
            userId: SelectedUserId,
            branchId: SelectedBranchId,
          },
          setChangeMade
        );
        setAllRoomSpecifications([
          ...AllRoomSpecifications,
          {
            id: id,
            roomId: roomId,
            Detail: Detail,
            Number: Number,
            type: type,
            Boolean: Boolean,
            userId: SelectedUserId,
            branchId: SelectedBranchId,
          },
        ]);
      } catch (error: any) {
        console.log(error.message);
      }
    };
    editRoomSpecificationApi = async (
      specificationId: string,
      propertyName: string,
      newValue: any,
      OriginalValue: any
    ) => {
      try {
        await updateValue(
          'room_specifications',
          specificationId,
          propertyName,
          newValue,
          setChangeMade,
          OriginalValue
        );
        setAllRoomSpecifications(
          AllRoomSpecifications.map((roomSpecification) =>
            roomSpecification.id === specificationId
              ? { ...roomSpecification, [propertyName]: newValue }
              : roomSpecification
          )
        );
      } catch (error: any) {
        console.error(error.message);
      }
    };
    deleteRoomSpecificationApi = async (roomSpecId: string) => {
      try {
        await deleteValue('room_specifications', roomSpecId);
        setAllRoomSpecifications(
          AllRoomSpecifications.filter(
            (roomSpecification) => roomSpecification.id !== roomSpecId
          )
        );
      } catch (error: any) {
        console.log(error.message);
      }
    };
  }
  class TenantApi {
    
    addTenantApi = async (
      id: string,
      name: string,
      phoneNumber: string,
      phoneNumber2: string,
      email: string,
      description: string,
      SelectedAgreement: string,
      RentingOrOut: boolean,
      startTime: number,
      endTime: string,
      agreedPrice: number,
      TIN: string,
      RentReason: string,
      AddedTime: number,
      Currency: string
    ) => {
      try {
        await addValue(
          'tenants',
          {
            id: id,
            name: name,
            phoneNumber: phoneNumber,
            phoneNumber2: phoneNumber2,
            email: email,
            description: description,
            SelectedAgreement: SelectedAgreement,
            RentingOrOut: RentingOrOut,
            startTime: new Date(startTime).getTime(),

            endTime: new Date(endTime).getTime(),
            agreedPrice: agreedPrice,
            TIN: TIN,
            RentReason: RentReason,
            AddedTime: AddedTime,
            userId: SelectedUserId,
            branchId: SelectedBranchId,
            Currency: Currency || GetDefaultCurrency(),
          },
          setChangeMade
        );
        setAllTenants([
          ...AllTenants,
          {
            id: id,
            name: name,
            phoneNumber: phoneNumber,
            phoneNumber2: phoneNumber2,
            email: email,
            description: description,
            SelectedAgreement: SelectedAgreement,
            RentingOrOut: RentingOrOut,
            startTime: new Date(startTime).getTime(),

            endTime: new Date(endTime).getTime(),
            agreedPrice: agreedPrice,
            TIN: TIN,
            RentReason: RentReason,
            AddedTime: AddedTime,
            userId: SelectedUserId,
            branchId: SelectedBranchId,
            Currency: Currency || GetDefaultCurrency(),
          },
        ]);
        setIsUpdatingTenantList(false);
      } catch (error: any) {
        console.log(error.message);
      }
    };
    EditTenantApi = async (
      tenantId: string,
      propertyName: string,
      newValue: any
    ) => {
      try {
        await updateValue(
          'tenants',
          tenantId,
          propertyName,
          newValue,
          setChangeMade,
          getOriginlPropertyValue(AllTenants, tenantId, propertyName)
        );
        setAllTenants(
          AllTenants.map((tenant) =>
            tenant.id === tenantId
              ? { ...tenant, [propertyName]: newValue }
              : tenant
          )
        );
        // this.getTenantsApi();
        //roomAPI.getRoomFromApi();
      } catch (error: any) {
        console.log(error.message);
      }
    };
    EditTenantApiWithOutRefresh = async (
      tenantId: string,
      propertyName: string,
      newValue: any
    ) => {
      try {
        await updateValue(
          'tenants',
          tenantId,
          propertyName,
          newValue,
          setChangeMade,
          getOriginlPropertyValue(AllTenants, tenantId, propertyName)
        );
        setAllTenants(
          AllTenants.map((tenant) =>
            tenant.id === tenantId
              ? { ...tenant, [propertyName]: newValue }
              : tenant
          )
        );
        // this.getTenantsApi();
        //roomAPI.getRoomFromApi();
      } catch (error: any) {
        console.log(error.message);
      }
    };
  }
  class RoomPaymentInfoApi {
    editRoomPaymentApi = async (
      roomPaymentId: string,
      propertyName: string,
      newValue: any,
      roomId: any,
      lastList: any
    ) => {
      try {
        const originalValue = RoomList.find(
          (r) => r.id === roomId
        )?.AllRoomPayInfo?.RoomPayInfo?.find(
          (item) => item.id === roomPaymentId
        )?.[propertyName];

        await updateValue(
          'room_pay_info',
          roomPaymentId,
          propertyName,
          newValue,
          setChangeMade,
          originalValue
        );

        setRoomList((prevRoomList) => {
          return prevRoomList.map((room) => {
            if (room.id === roomId) {
              const updatedPayInfo = lastList.find(
                (item: any) => item.id === roomPaymentId
              );
              console.log({
                ...room,
                AllRoomPayInfo: {
                  RoomPayInfo: lastList.map((item: { id: string; Paid: any }) =>
                    item.id === roomPaymentId
                      ? { ...item, Paid: !item.Paid }
                      : item
                  ),
                },
              });
              if (updatedPayInfo) {
                return {
                  ...room,
                  AllRoomPayInfo: {
                    RoomPayInfo: lastList.map(
                      (item: { id: string; Paid: any }) =>
                        item.id === roomPaymentId
                          ? { ...item, Paid: !item.Paid }
                          : item
                    ),
                  },
                };
              }
              return room;
            }
            return room;
          });
        });

        //roomAPI.getPaymentTimelineInfoAndSet(roomId);
        //roomAPI.getRoomFromApi();
      } catch (error: any) {
        console.log(error.message);
      }
    };
    deleteRoomPaymentApi = async (roomPaymentId: string) => {
      try {
        await deleteValue('room_pay_info', roomPaymentId);
      } catch (error: any) {
        console.log(error.message);
      }
    };
  }
  class PastTenantReviewApi {
    getPastTenantReviewLatestApi = async () => {
      try {
        const pastTenantReviewRaw = await getValuesWithSql(
          'PastTenantsForRoom',
          `WHERE 1 AND branchId = '${SelectedBranchId}'`
        );

        if (pastTenantReviewRaw) {
          const pastTenantReviews = pastTenantReviewRaw.map(
            (pastTenantReview: PastTenantReviewType) => {
              return {
                id: pastTenantReview.id,
                roomId: pastTenantReview.roomId,
                brokerId: pastTenantReview.brokerId,
                tenantId: pastTenantReview.tenantId,
                enterDate: pastTenantReview.enterDate,
                exitDate: pastTenantReview.exitDate,
                totalEarnings: pastTenantReview.totalEarnings,
                paymentCycleType: pastTenantReview.paymentCycleType,
                AgreedCommission: pastTenantReview.AgreedCommission,
                AgreedPrice: pastTenantReview.AgreedPrice,
                Stars: pastTenantReview.Stars,
                description: pastTenantReview.description,
                endReason: pastTenantReview.endReason,
                Currency: pastTenantReview.Currency,
              };
            }
          );
          setPastTenantReviews(pastTenantReviews);
        } else {
          setPastTenantReviews([]);
        }
      } catch (error: any) {
        console.error('Error fetching past tenant reviews:', error.message);
        setPastTenantReviews([]);
      }
    };
  }
  class BrokerApi {
    getBrokersApi = async () => {
      try {
        let useBranchId = storageManager.get('SelectedBranchId');

        const brokersRaw = await getValuesWithSql(
          'brokers',
          `WHERE 1 AND branchId = '${useBranchId}'`
        );
        if (brokersRaw) {
          const brokers = brokersRaw.map((broker: BrokerType) => {
            return {
              id: broker.id,
              name: broker.name,
              phoneNumber: broker.phoneNumber,
              phoneNumber2: broker.phoneNumber2 || '',
              email: broker.email || '',

              AddedTime: broker.AddedTime,
              AgreedCommission: broker.AgreedCommission,
              rating: broker.rating,
              notes: broker.notes,
            };
          });
          setBrokerList(brokers);
        }
      } catch (error: any) {
        console.log(error.message);
      }
    };
    addBrokerApi = async (broker: BrokerType) => {
      try {
        await addValue(
          'brokers',
          { ...broker, userId: SelectedUserId, branchId: SelectedBranchId },
          setChangeMade
        );
        await this.getBrokersApi();
      } catch (error: any) {
        console.log(error.message);
      }
    };
    editBrokerApi = async (
      brokerId: string,
      propertyName: string,
      newValue: any
    ) => {
      try {
        await updateValue(
          'brokers',
          brokerId,
          propertyName,
          newValue,
          setChangeMade,
          getOriginlPropertyValue(BrokerList, brokerId, propertyName)
        );
        await this.getBrokersApi();
      } catch (error: any) {
        console.log(error.message);
      }
    };
    deleteBrokerApi = async (brokerId: string) => {
      try {
        await deleteValue('brokers', brokerId);
        await this.getBrokersApi();
      } catch (error: any) {
        console.log(error.message);
      }
    };
  }
  class BrokersRecommendationListApi {
    AddBrokerRecommendation = async (
      id: string,
      brokerId: string,
      roomId: string,
      recommendedTenantId: string,
      AddedTime: number,
      AgreedCommission: number
    ) => {
      try {
        await addValue(
          'brokersRecommendationList',
          {
            id,
            brokerId,
            roomId,
            recommendedTenantId,
            AddedTime,
            AgreedCommission,
            branchId: SelectedBranchId,
            userId: SelectedUserId,
          },
          setChangeMade
        );
      } catch (error: any) {
        console.error(error.message);
      }
    };
    getBrokerRecommendationsFromApi = async () => {
      try {
        const brokerRecommendationsRaw = await getValuesWithSql(
          'brokersRecommendationList',
          `WHERE 1 AND branchId = '${SelectedBranchId}'`
        );
        if (brokerRecommendationsRaw) {
          const brokerRecommendations = brokerRecommendationsRaw.map(
            (recommendation: BrokerRecommendationType) => ({
              id: recommendation.id,
              roomId: recommendation.roomId,
              brokerId: recommendation.brokerId,
              recommendedTenantId: recommendation.recommendedTenantId,
              AddedTime: recommendation.AddedTime,
              AgreedCommission: recommendation.AgreedCommission,
            })
          );
          setBrokerRecommendationList(brokerRecommendations);
        }
      } catch (error) {
        console.error('Error fetching broker recommendations:', error);
      }
    };
  }
  class AgreementApi {
    getAgreementsApi = async () => {
      try {
        const agreementsRaw = AllAgreements.filter(
          (agreement) => agreement.branchId === SelectedBranchId
        );
        if (agreementsRaw) {
          return agreementsRaw.map((agreement: agreements) => ({
            id: agreement.id,
            roomId: agreement.roomId,
            tenantId: agreement.tenantId,
            startTime: agreement.startTime,
            endTime: agreement.endTime,
            signTime: agreement.signTime,
            agreedPrice: agreement.agreedPrice,
            paymentCycleType: agreement.paymentCycleType,
            Memo: agreement.Memo,
            RentReserved: agreement.RentReserved,
            representative: agreement.representative,
          }));
        }
      } catch (error: any) {
        console.log(error.message);
      }
    };

    getAgreementByIdApi = async (agreementId: string) => {
      try {
        const agreement = AllAgreements.find(
          (agreement) => agreement.id === agreementId
        );
        if (agreement && agreement.length > 0) {
          return {
            id: agreement[0].id,
            roomId: agreement[0].roomId,
            tenantId: agreement[0].tenantId,
            startTime: agreement[0].startTime,
            endTime: agreement[0].endTime,
            signTime: agreement[0].signTime,
            agreedPrice: agreement[0].agreedPrice,
            paymentCycleType: agreement[0].paymentCycleType,
            Memo: agreement[0].Memo,
            RentReserved: agreement[0].RentReserved,
            representative: agreement[0].representative,
          };
        }
      } catch (error: any) {
        console.log(error.message);
      }
    };

    getAgreementsByRoomIdApi = async (roomId: string) => {
      try {
        const agreements = AllAgreements.filter(
          (agreement) => agreement.roomId === roomId
        );
        if (agreements && agreements.length > 0) {
          return agreements.map((agreement: agreements) => ({
            id: agreement.id,
            roomId: agreement.roomId,
            tenantId: agreement.tenantId,
            startTime: agreement.startTime,
            endTime: agreement.endTime,
            signTime: agreement.signTime,
            agreedPrice: agreement.agreedPrice,
            paymentCycleType: agreement.paymentCycleType,
            Memo: agreement.Memo,
            RentReserved: agreement.RentReserved,
            representative: agreement.representative,
            Currency: agreement.Currency,
          }));
        }
        return [];
      } catch (error: any) {
        console.log(error.message);
        return [];
      }
    };
    editAgreementApi = async (
      agreementId: string,
      propertyName: string,
      newValue: any,
      originalValue: any
    ) => {
      try {
        await updateValue(
          'agreements',
          agreementId,
          propertyName,
          newValue,
          setChangeMade,
          originalValue
        );
        setAllAgreements((prev) =>
          prev.map((agreement) =>
            agreement.id === agreementId
              ? { ...agreement, [propertyName]: newValue }
              : agreement
          )
        );
      } catch (error: any) {
        console.log(error.message);
      }
    };

    deleteAgreementApi = async (agreementId: string) => {
      try {
        await deleteValue('agreements', agreementId);
        setAllAgreements((prev) =>
          prev.filter((agreement) => agreement.id !== agreementId)
        );
      } catch (error: any) {
        console.log(error.message);
      }
    };

    addAgreementApi = async (
      id: string,
      roomId: string,
      tenantId: string,
      startTime: number,
      endTime: number,
      signTime: number,
      agreedPrice: number,
      paymentCycleType: string,
      Memo: string,
      RentReserved: number,
      representative: string,
      Currency: string
    ) => {
      try {
        await addValue(
          'agreements',
          {
            id,
            roomId,
            tenantId,
            startTime,
            endTime,
            signTime,
            agreedPrice,
            paymentCycleType,
            Memo,
            RentReserved,
            representative,
            userId: SelectedUserId,
            branchId: SelectedBranchId,
            Currency,
          },
          setChangeMade
        );
        setAllAgreements((prev) => [
          ...prev,
          {
            id,
            roomId,
            tenantId,
            startTime,
            endTime,
            signTime,
            agreedPrice,
            paymentCycleType,
            Memo,
            RentReserved,
            representative,
            userId: SelectedUserId,
            branchId: SelectedBranchId,
            Currency,
          },
        ]);
      } catch (error: any) {
        console.log(error.message);
      }
    };
  }
  const roomAPI = new RoomApi();
  const brokerApi = new BrokerApi();
  const tenantAPI = new TenantApi();
  const pastTenantReviewApi = new PastTenantReviewApi();
  const roomSpecificationAPI = new RoomSpecificationApi();
  const roomPaymentInfoApi = new RoomPaymentInfoApi();
  const brokersRecommendationListApi = new BrokersRecommendationListApi();
  const agreementApi = new AgreementApi();
  // On start
  useEffect(() => {
    const init = async () => {
      const branchId = storageManager.get('SelectedBranchId');
      setSelectedBranchId(branchId);
      setBranches(storageManager.get('Branches'));

      //RefreshDataFromSqlite();
    };
    init();
  }, []);
  const [MainSqliteRefreshLoading, setMainSqliteRefreshLoading] =
    useState(false);
  const RefreshDataFromSqlite = async () => {
    setMainSqliteRefreshLoading(true);
    if (!navigator.onLine) {
      setBranches(storageManager.get('Branches'));
    } else {
      await fetchBranches();
    }

    const branchId = storageManager.get('SelectedBranchId');
    setSelectedBranchId(branchId);
    if (branchId) {
      try {
        const userId = storageManager.get('users')[0].id;
        const branchId = storageManager.get('SelectedBranchId');

        const AllRoomPayInfo2 = await getValuesWithSql(
          'room_pay_info',
          `WHERE userId = '${userId}' AND branchId = '${branchId}'`
        );
        setAllRoomPayInfo(AllRoomPayInfo2);
        const AllTenants2 = await getValuesWithSql(
          'tenants',
          `WHERE userId = '${userId}' AND branchId = '${branchId}'`
        );
        setAllTenants(AllTenants2);
        const AllUtilityPayments2 = await getValuesWithSql(
          'utility_payments',
          `WHERE userId = '${userId}' AND branchId = '${branchId}'`
        );
        setAllUtilityPayments(AllUtilityPayments2);
        const AllAgreement2 = await getValuesWithSql(
          'agreements',
          `WHERE userId = '${userId}' AND branchId = '${branchId}'`
        );
        setAllAgreements(AllAgreement2);
        const utilityPaymentsSettings2 = await getValuesWithSql(
          'utility_payments_settings',
          `WHERE userId = '${userId}' AND branchId = '${branchId}'`
        );
        setAllUtilityPaymentsSettings(utilityPaymentsSettings2);
        const AllEmailTemplates2 = await getValuesWithSql(
          'email_templates',
          `WHERE userId = '${userId}'`
        );
        setAllEmailTemplates(AllEmailTemplates2);
        const AllSmsTemplates2 = await getValuesWithSql(
          'sms_templates',
          `WHERE userId = '${userId}'`
        );
        setAllSmsTemplates(AllSmsTemplates2);
        const AllRoomSpecifications2 = await getValuesWithSql(
          'room_specifications',
          `WHERE userId = '${userId}' AND branchId = '${branchId}'`
        );

        setAllRoomSpecifications(AllRoomSpecifications2);
        const AllNotificationTemplateSelection2 = await getValuesWithSql(
          'notification_template_selections',
          `WHERE userId = '${userId}' AND branchId = '${branchId}'`
        );
        setAllNotificationTemplateSelections(AllNotificationTemplateSelection2);
        const AllRoomPayInfoHistory2 = await getValuesWithSql(
          'room_pay_info_history',
          `WHERE userId = '${userId}' AND branchId = '${branchId}'`
        );
        setAllRoomPayInfoHistory(AllRoomPayInfoHistory2);
        const AllExpenses2 = await getValuesWithSql(
          'expenses',
          `WHERE userId = '${userId}' AND branchId = '${branchId}'`
        );
        setAllExpenses(AllExpenses2);

        roomAPI.getRoomFromApi(
          AllRoomSpecifications2,
          utilityPaymentsSettings2,
          AllRoomPayInfo2,
          AllAgreement2
        );
        brokerApi.getBrokersApi();
      
        pastTenantReviewApi.getPastTenantReviewLatestApi();
        brokersRecommendationListApi.getBrokerRecommendationsFromApi();
      } catch (error: any) {
        alert('Error getting data: ' + error.message);
        console.log(error.message);
      }
    } else {
      if (!storageManager.get('LockBranchToPc'))
        setViewBranchManagementPage(true);
      else {
        setViewBranchManagementPage(true);
        setViewBranchManagementPageNONAdm(true);
      }
    }

    getBranchName(branchId);
    setMainSqliteRefreshLoading(false);
  };
  // Fetch exchange rates on component mount
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      // Check last sync time
      const lastUpdate = storageManager.get('lastExchangeRateUpdate');
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      // Fetch if online and either:
      // - lastUpdate is undefined
      // - lastUpdate was more than a day ago
      if (navigator.onLine && (!lastUpdate || lastUpdate < oneDayAgo)) {
        const exchangeRates2 = await getValuesWithSql_Online(
          'Exchange_RatesUSDtoETB',
          'WHERE 1'
        );
        if (exchangeRates2.length > 0) {
          const latestRate = exchangeRates2;
          storageManager.set('exchangeRate', latestRate);
          storageManager.set(
            'lastExchangeRateUpdate',
            latestRate[latestRate.length - 1].id * 1000
          );
          setRefresh(Refresh + 1);
        }
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  const [ThemeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const get = async () => {
      const storedTheme = storageManager.get('ThemeMode');
      if (storedTheme) {
        setThemeMode(storedTheme);
        applyTheme(storedTheme);
      } else {
        applyTheme('light');
      }
    };
    get();
  }, []);

  const ChangeTheme = async (theme: 'light' | 'dark') => {
    storageManager.set('ThemeMode', theme);
    setThemeMode(theme);
    applyTheme(theme);
  };

  const applyTheme = (theme: 'light' | 'dark') => {
    const body = document.body;
    body.classList.remove('DarkTheme');
    if (theme === 'dark') {
      body.classList.add('DarkTheme');
    }
  };

  const [Refresh, setRefresh] = useState(0);
  const [isSignedIn, setisSignedIn] = useState(false);
  const signOutUserAndRestart = async () => {
    await SignOutUser();
    storageManager.set('MainBackupPath', '');
    storageManager.set('SelectedBranchId', '');
    storageManager.set('MainBackupPath', '');
    storageManager.set('LockBranchToPc', false);
    storageManager.set('users', []);
    setRefresh(Refresh + 1);
    setisSignedIn(false);
  };

  const [SelectedUserId, setSelectedUserId] = useState('');
  const [ChangeMade, setChangeMade] = useState(0);
  useEffect(() => {
    const getChanges = async () => {
      const OfflineChanges = await getValuesWithSql(
        'offline_changes',
        'WHERE 1'
      );
      if (OfflineChanges) {
        setChangeMade(OfflineChanges.length);
      }
    };
    if (window.electron) {
      getChanges();
    }
  }, [ChangeMade]);
  const [UploadingLoadingEffect, setUploadingLoadingEffect] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [UploadAssetsProgress, setUploadAssetsProgress] = useState(0);

  const handleUploadChanges = async () => {
    if (!UploadingLoadingEffect) {
      setUploadProgress(0);
      setUploadingLoadingEffect(true);
      setIsSyncing(true);
      setSyncProgress(0);

      if (navigator.onLine) {
        const offline_changes = await getValuesWithSql(
          'offline_changes',
          'WHERE 1'
        );
        if (offline_changes.length > 0) {
          const offline_changes_data = offline_changes.map((change: any) => ({
            id: change.id,
            type: change.type,
            columnName: change.columnName,
            rowId: change.rowId,
            newValue: change.newValue,
            tableName: change.tableName,
            addedJsonData: change.addedJsonData,
          }));

          await Upload(
            offline_changes_data,
            SelectedUserId,
            setUploadProgress,
            RefreshDataFromSqlite
          );
        }
      } else {
        console.log('Wait it is already uploading');
      }
      setChangeMade(0);
      setUploadProgress(0);
      setUploadingLoadingEffect(false);
    }
  };
  useEffect(() => {
    // @ts-ignore
    window.handleUploadChanges = handleUploadChanges;
  }, [handleUploadChanges]);
  useEffect(() => {
    if (UploadingLoadingEffect)
      if (uploadProgress >= 0 && uploadProgress <= 99) {
        setSyncProgress(uploadProgress);
        setIsSyncing(true);
      } else {
        setSyncProgress(0);
        setIsSyncing(false);
      }
  }, [uploadProgress]);
  //Initial syncing
  const [isSyncing, setIsSyncing] = useState(false);
  const [SyncProgress, setSyncProgress] = useState(0);
  const [changeProgress, setChangeProgress] = useState(0);
  const colors = {
    primary: 'var(--Primary-Color)',
    secondary: 'var(--Secondary-Color)',
    background: 'var(--Background-Color)',
    text: 'var(--Text-Color)',
  };
  const SyncLoadingPopup = ({ colors, isVisible }: any) => {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: isVisible ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
        }}
      >
        <div
          style={{
            backgroundColor: colors.background,
            color: colors.text,
            padding: 'var(--20px-V)',
            borderRadius: 'var(--10px-V)',
            boxShadow: '0 0 var(--10px-V) rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              border: `var(--4px-V) solid ${colors.secondary}`,
              borderTop: `var(--4px-V) solid ${colors.primary}`,
              borderRadius: '50%',
              width: 'var(--40px-V)',
              height: 'var(--40px-V)',
              animation: 'spin 1s linear infinite',
              margin: '0 auto var(--10px-V)',
            }}
          />
          <p style={{ margin: 0 }}>
            {UploadingLoadingEffect ? 'Uploading...' : 'Syncing...'}{' '}
            {SyncProgress.toFixed(1)}%
          </p>
        </div>
      </div>
    );
  };

  const [AppUserManagerShow, setAppUserManagerShow] = useState(false);
  const [SelectedAppUser, setSelectedAppUser] = useState<appUser | null>(null);
  const [AppUserManagerPromptPassword, setAppUserManagerPromptPassword] =
    useState(false);
  const [SelectedPage, setSelectedPage] = useState<
    | 'Rooms'
    | 'People'
    | 'Dashboard'
    | 'Calendar'
    | 'Settings'
    | 'Database'
    | 'Tools'
    | 'non'
  >(() => {
    const privileges = getUserPrivileges(SelectedAppUser);
    if (privileges.viewDashboard) return 'Dashboard';
    if (privileges.viewRoomsPage) return 'Rooms';
    if (privileges.viewPeoplesPage) return 'People';
    if (privileges.viewCalendar) return 'Calendar';
    if (privileges.viewDatabase) return 'Database';
    if (privileges.viewToolsPage) return 'Tools';
    return 'non'; // Default fallback
  });

  const [ViewBranchManagementPage, setViewBranchManagementPage] =
    useState(true);
  const [ViewBranchManagementPageNONAdm, setViewBranchManagementPageNONAdm] =
    useState(false);
  const [SelectedBranchId, setSelectedBranchId] = useState('');

  const privileges = getUserPrivileges(SelectedAppUser);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedPage((prevPage) => {
        if (privileges.viewDashboard) return 'Dashboard';
        if (privileges.viewRoomsPage) return 'Rooms';
        if (privileges.viewPeoplesPage) return 'People';
        if (privileges.viewCalendar) return 'Calendar';
        if (privileges.viewDatabase) return 'Database';
        if (privileges.viewToolsPage) return 'Tools';
        return prevPage;
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [SelectedAppUser]);
  const [branchName, setBranchName] = useState('');

  const getBranchName = async (branchId: string) => {
    if (navigator.onLine) {
      try {
        console.log(storageManager.get('Branches'), 'branches');
        const branch = storageManager
          .get('Branches')
          .find((b) => b.id === branchId);

        if (branch) {
          setBranchName(branch.name);
        } else {
          console.error('Branch not found');
        }
      } catch (error) {
        console.error('Error fetching branch name:', error);
        setBranchName(storageManager.get('BranchName'));
      }
    } else {
      setBranchName(storageManager.get('BranchName'));
    }
  };
  const generateRecurringExpenses = (
    expenses: expenses[],
    startDate: Date,
    endDate: Date
  ): expenses[] => {
    let allExpenses: expenses[] = [];

    expenses.forEach((expense) => {
      if (expense.doesReoccur) {
        const StartExpenseDate = new Date(expense.date);
        StartExpenseDate.setHours(0, 0, 0, 0);

        // Get the actual start date (either expense start date or period start date)
        const effectiveStartDate = new Date(StartExpenseDate.getTime());

        let currentDate = effectiveStartDate;
        let expenseCount = 0;

        // Calculate end date based on expense settings
        const finalEndDate = expense.HasEndDate
          ? new Date(Math.min(expense.EndDate, endDate.getTime()))
          : endDate;

        while (currentDate <= finalEndDate && expenseCount < 100) {
          const expenseId = `${expense.id}-${currentDate.getTime()}`;

          // Only add if the expense date falls within our range
          if (
            currentDate >= startDate &&
            (currentDate <= endDate || expense.HasEndDate)
          ) {
            allExpenses.push({
              ...expense,
              id: expenseId,
              date: currentDate.getTime(),
            });
          }

          // Calculate next expense date based on recurring type
          switch (expense.recurringType) {
            case 'Day':
              // Add days based on recurringCycle
              currentDate = addDays(currentDate, expense.recurringCycle);
              break;
            case 'Monthly':
              // Add one month to current date
              const nextMonthDate = new Date(currentDate);
              nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
              currentDate = nextMonthDate;
              break;

            case 'Yearly':
              // Preserve month and day when adding years
              const nextYearDate = new Date(currentDate);
              const originalMonth = nextYearDate.getMonth();
              const originalDay = nextYearDate.getDate();
              nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
              // Ensure we keep the same month and day
              nextYearDate.setMonth(originalMonth);
              nextYearDate.setDate(originalDay);
              currentDate = nextYearDate;
              console.log(currentDate, 'lllllllllll');
              break;

            default:
              console.warn(
                `Unknown recurring type: ${expense.recurringType}, defaulting to monthly`
              );
              const defaultNextDate = new Date(currentDate);
              defaultNextDate.setMonth(defaultNextDate.getMonth() + 1);
          }

          expenseCount++;
        }
      } else {
        // For non-recurring expenses, only include if within date range
        const expenseDate = new Date(expense.date);
        expenseDate.setHours(0, 0, 0, 0);

        if (expenseDate >= startDate && expenseDate <= endDate) {
          allExpenses.push({
            ...expense,
            date: expenseDate.getTime(),
          });
        }
      }
    });

    // Sort expenses by date
    return allExpenses.sort((a, b) => a.date - b.date);
  };
  const [getBranchData, setGetBranchData] = useState(false); // Control whether to fetch detailed branch data
  const processValueByCurrency = (
    value: number,
    currency: string | undefined,
    date: number
  ) => {
    const { rate, direction } = getRateByDate(date);
    console.log(value, currency || GetDefaultCurrency());
    if (!rate) {
      console.warn('No rate available, using current rate as fallback');
      return 0; // Return 0 if no rate found to be consistent
    }
    const currencyDisplay = GetDefaultCurrency();

    // For ALL_ETB, convert USD to ETB
    if (currencyDisplay === 'ETB') {
      if (currency === 'USD') {
        return value * rate;
      }
      return value;
    }

    // For ALL_USD, convert ETB to USD
    if (currencyDisplay === 'USD') {
      if (currency === 'ETB') {
        return value / rate;
      }
      return value;
    }

    return 0;
  };
  const fetchBranches = async () => {
    if (navigator.onLine) {
      if (storageManager.get('users')?.[0]) {
        const branches = await getValuesWithSql_Online(
          'branches',
          `WHERE userId = '${storageManager.get('users')[0].id}'`
        );
        if (branches)
          if (getBranchData) {
            const branchesWithData = await Promise.all(
              branches.map(async (branch: BranchType) => {
                const allRooms =
                  (await getValuesWithSql_Online(
                    'rooms',
                    `WHERE branchId = '${branch.id}'`
                  )) || [];

                const allTenants =
                  (await getValuesWithSql_Online(
                    'tenants',
                    `WHERE branchId = '${branch.id}'`
                  )) || [];

                // Get payments for current month
                const today = new Date();
                const monthStart = new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  1
                );
                const monthEnd = new Date(
                  today.getFullYear(),
                  today.getMonth() + 1,
                  0
                );

                const actualPayments = await getValuesWithSql_Online(
                  'room_pay_info',
                  `WHERE Day >= ${monthStart.getTime()} 
                 AND Day <= ${monthEnd.getTime()} 
                 AND branchId = '${branch.id}'
                 AND Paid = 1`
                );

                const historicalPayments = await getValuesWithSql_Online(
                  'room_pay_info_history',
                  `WHERE Day >= ${monthStart.getTime()} 
                 AND Day <= ${monthEnd.getTime()} 
                 AND branchId = '${branch.id}'
                 AND Paid = 1`
                );

                // Process payments with currency conversion
                const monthlyRevenue = [
                  ...actualPayments,
                  ...historicalPayments,
                ].reduce((sum, payment) => {
                  const convertedValue = processValueByCurrency(
                    parseFloat(payment.Value),
                    allRooms.find((r: RoomType) => r.id === payment.roomId)
                      ?.Currency || GetDefaultCurrency(),
                    payment.Day
                  );
                  return sum + convertedValue;
                }, 0);

                // Get and process expenses with currency conversion
                const branchExpenses =
                  (await getValuesWithSql_Online(
                    'expenses',
                    `WHERE branchId = '${branch.id}'`
                  )) || [];

                const allMonthExpenses = generateRecurringExpenses(
                  branchExpenses,
                  monthStart,
                  monthEnd
                );

                const monthlyExpenses = allMonthExpenses
                  .filter(
                    (e) =>
                      new Date(e.date) >= monthStart &&
                      new Date(e.date) <= monthEnd
                  )
                  .reduce((sum, expense) => {
                    const convertedValue = processValueByCurrency(
                      parseFloat(expense.price || '0'),
                      expense.Currency || GetDefaultCurrency(),
                      new Date(expense.date).getTime()
                    );
                    return sum + convertedValue;
                  }, 0);

                const monthlyProfit = monthlyRevenue - monthlyExpenses;

                return {
                  ...branch,
                  totalRooms: allRooms.length,
                  totalFloors:
                    Math.max(...allRooms.map((room) => room.floor)) ===
                    -Infinity
                      ? 0
                      : Math.max(...allRooms.map((room) => room.floor)),
                  totalTenants: allTenants.length,
                  occupiedRooms: allRooms.filter((room) => room.tenantId !== '')
                    .length,
                  vacantRooms: allRooms.filter((room) => room.tenantId === '')
                    .length,
                  monthlyRevenue,
                  monthlyExpenses,
                  monthlyProfit,
                  currency: GetDefaultCurrency(), // Add currency information
                  unpaidPastPayments: 0,
                  userAccountsWhichHaveAccess: [],
                };
              })
            );

            setBranches(branchesWithData);
            storageManager.set('Branches', branchesWithData);
          } else {
            setBranches(branches);
            storageManager.set('Branches', branches);
          }
      }
    } else {
      if (storageManager.get('Branches')) {
        setBranches(storageManager.get('Branches'));
      }
    }
  };
  const [Branches, setBranches] = useState<BranchTypeWithData[]>([]);

  useEffect(() => {
    const perfObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 100) {
          // Log slow renders
          console.warn('Slow render:', entry);
        }
      }
    });

    perfObserver.observe({ entryTypes: ['measure'] });

    return () => perfObserver.disconnect();
  }, []);
  const [ShowAdvancedUpload, setShowAdvancedUpload] = useState(false);

  return (
    <AlertProvider>
      <ConfirmProvider>
        {' '}
        <>
          {' '}
          {SyncProgress >= 1 && SyncProgress <= 99 && (
            <>
              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${SyncProgress}%`,
                    position: 'absolute',
                    zIndex: 10000,
                  }}
                ></div>
              </div>
            </>
          )}{' '}
          {MainSqliteRefreshLoading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000,
              }}
            >
              <img
                src={loadingGif}
                alt="Loading..."
                style={{ width: 'var(--100px-V)', height: 'var(--100px-V)' }}
              />
              <p
                style={{
                  color: 'white',
                  fontSize: 'var(--16px-V)',
                  fontWeight: '500',
                }}
              >
                Refreshing Data
              </p>
            </div>
          )}
          <SyncLoadingPopup colors={colors} isVisible={isSyncing} />
          <AccountManager
            Refresh={Refresh}
            isSignedIn={isSignedIn}
            setisSignedIn={setisSignedIn}
            setChangeMade={setChangeMade}
            SelectedUserId={SelectedUserId}
            setSelectedUserId={setSelectedUserId}
            setIsSyncing={setIsSyncing}
            RefreshDataFromSqlite={RefreshDataFromSqlite}
            setSyncProgress={setSyncProgress}
            signOutUserAndRestart={signOutUserAndRestart}
            setAppUserManagerShow={setAppUserManagerShow}
            AppUserManagerShow={AppUserManagerShow}
            AppUserManagerPromptPassword={AppUserManagerPromptPassword}
            setAppUserManagerPromptPassword={setAppUserManagerPromptPassword}
            setSelectedAppUser={setSelectedAppUser}
            SelectedAppUser={SelectedAppUser}
            ViewBranchManagementPage={ViewBranchManagementPage}
            setViewBranchManagementPage={setViewBranchManagementPage}
            SelectedBranchId={SelectedBranchId}
            setSelectedBranchId={setSelectedBranchId}
            setViewBranchManagementPageNONAdm={
              setViewBranchManagementPageNONAdm
            }
            ViewBranchManagementPageNONAdm={ViewBranchManagementPageNONAdm}
            fetchBranches={fetchBranches}
            Branches={Branches}
            setBranches={setBranches}
            setBranchName={setBranchName}
            setGetBranchData={setGetBranchData}
            getBranchData={getBranchData}
            ProvidedInitialUsername={username}
            ForceSignUp={signup}
          >
            <>
              <NavBar
                RefreshDataFromSqlite={RefreshDataFromSqlite}
                UploadAssetsProgress={UploadAssetsProgress}
                setUploadAssetsProgress={setUploadAssetsProgress}
                setIsSyncing={setIsSyncing}
                SelectedUserId={SelectedUserId}
                isSyncing={isSyncing}
                setSyncProgress={setSyncProgress}
                ChangeMade={ChangeMade}
                handleUpload={handleUploadChanges}
                uploadProgress={uploadProgress}
                UploadingLoadingEffect={UploadingLoadingEffect}
                ProfileState={false}
                SelectedPage={SelectedPage}
                setSelectedPage={setSelectedPage}
                ShowAdvancedUpload={ShowAdvancedUpload}
                setShowAdvancedUpload={setShowAdvancedUpload}
                Image={''}
                ShopName={'The company'}
                ThemeMode={ThemeMode}
                setViewBranchManagementPageNONAdm={
                  setViewBranchManagementPageNONAdm
                }
                branchName={branchName}
                setThemeMode={ChangeTheme}
                ChangeTheme={ChangeTheme}
                signOutUserAndRestart={signOutUserAndRestart}
                setAppUserManagerShow={setAppUserManagerShow}
                setAppUserManagerPromptPassword={
                  setAppUserManagerPromptPassword
                }
                SelectedAppUser={SelectedAppUser}
                setChangeMade={setChangeMade}
                setViewBranchManagementPage={setViewBranchManagementPage}
              ></NavBar>
              <MainPage
                roomSpecificationAPI={roomSpecificationAPI}
                SelectedPage={SelectedPage}
                changeProgress={changeProgress}
                setChangeProgress={setChangeProgress}
                setSelectedPage={setSelectedPage}
                signOutUserAndRestart={signOutUserAndRestart}
                RoomList={RoomList}
                setRoomList={setRoomList}
                
                roomAPI={roomAPI}
                tenantAPI={tenantAPI}
                roomPaymentInfoApi={roomPaymentInfoApi}
                isUpdatingTenantList={isUpdatingTenantList}
                setIsUpdatingTenantList={setIsUpdatingTenantList}
                pastTenantReviewApi={pastTenantReviewApi}
                brokerApi={brokerApi}
                BrokerList={BrokerList}
                setBrokerList={setBrokerList}
                PastTenantReviews={PastTenantReviews}
                brokersRecommendationListApi={brokersRecommendationListApi}
                RefreshDataFromSqlite={RefreshDataFromSqlite}
                BrokerRecommendationList={BrokerRecommendationList}
                agreementApi={agreementApi}
                setChangeMade={setChangeMade}
                SelectedAppUser={SelectedAppUser}
                SelectedUserId={SelectedUserId}
                SelectedBranchId={SelectedBranchId}
              />
            
            </>
          </AccountManager>  <CornerSupport  SelectedUserId={SelectedUserId}/>
          {/**/}
          {tryout && (
            <p
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(50%, 50%)',
              }}
            >
              THIS IS A TUTORIAL
            </p>
          )}
        </>
      </ConfirmProvider>
    </AlertProvider>
  );
}
import { BrowserRouter } from 'react-router-dom';
function UserRoute() {
  const { username } = useParams();
  return (
    <GlobalProvider>
      <Hello tryout={false} username={username || 'none_provided'} />
    </GlobalProvider>
  );
}

export default function App() {
  if (window.electron) {
    return (
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <GlobalProvider>
                <Hello tryout={false} username={'none_provided'} signup={''} />
              </GlobalProvider>
            }
          />
        </Routes>
      </Router>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/app"
          element={
            <GlobalProvider>
              <Hello tryout={false} username={'none_provided'} signup={''} />
            </GlobalProvider>
          }
        />{' '}
        <Route
          path="/signup"
          element={
            <GlobalProvider>
              <Hello tryout={false} username={'none_provided'} signup={'up'} />
            </GlobalProvider>
          }
        />{' '}
        <Route
          path="/login"
          element={
            <GlobalProvider>
              <Hello tryout={false} username={'none_provided'} signup={'in'} />
            </GlobalProvider>
          }
        />
        <Route
          path="/app/tryout"
          element={
            <GlobalProvider>
              <Hello tryout={true} username={'none_provided'} signup={''} />
            </GlobalProvider>
          }
        />
        {/* <Route path="/login" element={
          <GlobalProvider>
            <Hello tryout={true} username={'login'}/>
          </GlobalProvider>
        } />
         <Route path="/signup" element={
          <GlobalProvider>
            <Hello tryout={true} username={'signup'}/>
          </GlobalProvider>
        } />
        <Route path="/@:username" element={<UserRoute />} /> */}
        <Route
          path="/"
          element={
            <GlobalProvider>
              <AppABC></AppABC>
            </GlobalProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

import AppABC from '../../RentMaster Website/RentalSite/src/App';
export const getUserPrivileges = (
  selectedAppUser: appUser | null
): {
  viewDashboard: boolean;
  viewPeoplesPage: boolean;
  viewCalendar: boolean;
  viewDatabase: boolean;
  editDatabaseData: boolean;
  viewToolsPage: boolean;
  editEmailTemplates: boolean;
  editSmsTemplates: boolean;
  editExpenses: boolean;
  editSettings: boolean;
  viewRoomsPage: boolean;
  addRoom: boolean;
  editRoomData: boolean;
  editRoomPayment: boolean;
  editUtilityPayments: boolean;
  editTenantRoomTenantInfo: boolean;
  editTenantRoomTenantPortal: boolean;
  editTenantRoomAgreementInfo: boolean;
  editTenantRoomUtilitySettings: boolean;
  editTenantRoomAttachments: boolean;
  editTenantRoomNotificationSettings: boolean;
  editTenantRoomTenantStay: boolean;
  addTenant: boolean;
  addBranch: boolean;
} => {
  const privilegeObject: { [key: string]: boolean } = {
    viewDashboard: false,
    viewPeoplesPage: false,
    viewCalendar: false,
    viewDatabase: false,
    editDatabaseData: false,
    viewToolsPage: false,
    editEmailTemplates: false,
    editSmsTemplates: false,
    editExpenses: false,
    editSettings: false,
    viewRoomsPage: false,
    addRoom: false,
    editRoomData: false,
    editRoomPayment: false,
    editUtilityPayments: false,
    editTenantRoomTenantInfo: false,
    editTenantRoomTenantPortal: false,
    editTenantRoomAgreementInfo: false,
    editTenantRoomUtilitySettings: false,
    editTenantRoomAttachments: false,
    editTenantRoomNotificationSettings: false,
    editTenantRoomTenantStay: false,
    addTenant: false,
    addBranch: false,
  };

  if (selectedAppUser) {
    if (selectedAppUser.id === 'admin') {
      Object.keys(privilegeObject).forEach((key) => {
        privilegeObject[key] = true;
      });
    } else if (selectedAppUser.privileges) {
      const userPrivileges = selectedAppUser.privileges.split(',');

      userPrivileges.forEach((privilege) => {
        switch (privilege.trim()) {
          case 'View dashboard page':
            privilegeObject.viewDashboard = true;
            break;
          case 'View peoples page':
            privilegeObject.viewPeoplesPage = true;
            break;
          case 'View calendar page':
            privilegeObject.viewCalendar = true;
            break;
          case 'View database page':
            privilegeObject.viewDatabase = true;
            break;
          case 'edit database data':
            privilegeObject.editDatabaseData = true;
            break;
          case 'View tools page':
            privilegeObject.viewToolsPage = true;
            break;
          case 'edit email templates':
            privilegeObject.editEmailTemplates = true;
            break;
          case 'edit sms templates':
            privilegeObject.editSmsTemplates = true;
            break;
          case 'edit expenses':
            privilegeObject.editExpenses = true;
            break;
          case 'edit settings':
            privilegeObject.editSettings = true;
            break;
          case 'View rooms page':
            privilegeObject.viewRoomsPage = true;
            break;
          case 'Add a room':
            privilegeObject.addRoom = true;
            break;
          case 'Add a tenant':
            privilegeObject.addTenant = true;
            break;
          case 'edit room data':
            privilegeObject.editRoomData = true;
            break;
          case 'edit rent payments':
            privilegeObject.editRoomPayment = true;
            break;
          case 'edit utility payments':
            privilegeObject.editUtilityPayments = true;
            break;
          case 'edit tenant room tenant info':
            privilegeObject.editTenantRoomTenantInfo = true;
            break;
          case 'edit tenant room tenant portal':
            privilegeObject.editTenantRoomTenantPortal = true;
            break;
          case 'edit tenant room agreement info':
            privilegeObject.editTenantRoomAgreementInfo = true;
            break;
          case 'edit tenant room utility settings':
            privilegeObject.editTenantRoomUtilitySettings = true;
            break;
          case 'edit tenant room attachments':
            privilegeObject.editTenantRoomAttachments = true;
            break;
          case 'edit tenant room notification settings':
            privilegeObject.editTenantRoomNotificationSettings = true;
            break;
          case 'edit tenant room tenant stay':
            privilegeObject.editTenantRoomTenantStay = true;
            break;
          case 'add a branch':
            privilegeObject.addBranch = true;
            break;
        }
      });
    }
  }

  return privilegeObject;
};
