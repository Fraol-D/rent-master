import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import MainPage from './Project/TSX/MainPage';
import { useEffect, useState } from 'react';
import NavBar from './Project/TSX/Navbar/NavBar';
import LogoImage from './assets/Insert Image Pic.png';
import { initializeInputBehavior } from './Project/TSX/Helpers/initializeInputs';

const { v4: uuidv4 } = require('uuid');
import {
  addValue,
  addValueROOM,
  deleteValue,
  getValues,
  getValuesWithSql,
  updateValue,
} from 'Backend/localServerApis';
import AccountManager from './Project/TSX/Sign up and login/AccountManager';
import {
  getValuesWithSql_Online,
  SignOutUser,
  Upload,
  UploadUserFilesToTheOnlineDatabase,
} from 'Backend/OnlineServerApis';
import {
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  isAfter,
  isBefore,
} from 'date-fns';
import { Payment } from 'electron';
import { GetDefaultCurrency } from './Project/TSX/Helpers/CurrencySign';
declare global {}
function Hello() {
  useEffect(() => {
    // Initialize input behavior
    const cleanup = initializeInputBehavior();

    // Cleanup on unmount
    return cleanup;
  }, []);
  const [RoomList, setRoomList] = useState<RoomType[]>([]);
  const [TenantList, setTenantList] = useState<tenant[]>([]);
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
  const calculatePredictedPayments = async (room: RoomType) => {
    const allPayments = [];
    const today = new Date();
    const yearEnd = new Date(today.getFullYear() + 1, 11, 31);
    const tenant = await getValuesWithSql(
      'tenants',
      `WHERE id = '${room.tenantId}'`
    );
    let startDate = new Date(tenant[0]?.startTime || Date.now()).getTime();

    let endDate = null;
    if (room.selectedAgreementId) {
      const agreements = await getValuesWithSql(
        'agreements',
        `WHERE id = '${room.selectedAgreementId}'`
      );
      if (agreements.length > 0) {
        startDate = agreements[0].startTime;
      }
      if (tenant[0]?.SelectedAgreement === 'Fixed-Term') {
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

    const actualPayments = await getValuesWithSql(
      'room_pay_info',
      `WHERE roomId = '${room.id}' AND tenantId = '${room.tenantId}'`
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
    getRoomFromApi = async () => {
      let useBranchId = window.electron.store.get('SelectedBranchId');
      const roomsRaw = await getValuesWithSql(
        'rooms',
        `WHERE 1 AND branchId = '${useBranchId}'`
      );

      if (roomsRaw) {
        const rooms = await Promise.all(
          roomsRaw.map(async (room: RoomType) => {
            const getRoomSpecifications = async () => {
              return roomSpecificationAPI.getRoomSpecificationApi(room.id);
            };

            const roomSpecifications = (await getRoomSpecifications()) || [];

            const utilityPayments = await getValuesWithSql(
              'utility_payments_settings',
              `WHERE roomId = '${room.id}'`
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
            const predictedPayments = await calculatePredictedPayments(room);

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
            };
          })
        );
        setRoomList(rooms);
      }
    };
    getSpecificValueFromRoomAPI = async (
      roomId: string,
      propertyName: string
    ) => {
      const room = await getValuesWithSql('rooms', `WHERE id = '${roomId}'`);
      return room[0][propertyName];
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

        await this.getRoomFromApi();
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
        await this.getRoomFromApi();
      } catch (error: any) {
        console.error(error.message);
      }
    };
    DeleteRoom = async (roomId: string) => {
      try {
        await deleteValue('rooms', roomId, setChangeMade);
        this.getRoomFromApi();
        /* Delete All room specifications */
      } catch (error: any) {
        console.log(error.message);
      }
    };
    RemoveTenant = async (roomId: string) => {
      try {
        await deleteValue('rooms', roomId);
        this.getRoomFromApi();
        /* Delete All room specifications */
      } catch (error: any) {
        console.log(error.message);
      }
    };
  }
  class RoomSpecificationApi {
    getRoomSpecificationApi = async (roomID: string) => {
      const roomSpecificationsRaw = await getValuesWithSql(
        'room_specifications',
        `WHERE roomId = '${roomID}' AND branchId = '${SelectedBranchId}'`
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
      } catch (error: any) {
        console.error(error.message);
      }
    };
    deleteRoomSpecificationApi = async (roomSpecId: string) => {
      try {
        await deleteValue('room_specifications', roomSpecId);
      } catch (error: any) {
        console.log(error.message);
      }
    };
  }
  class TenantApi {
    getTenantsApi = async () => {
      try {
        let useBranchId = window.electron.store.get('SelectedBranchId');

        const tenantsRaw = await getValuesWithSql(
          'tenants',
          `WHERE 1 AND branchId = '${useBranchId}'`
        );
        if (tenantsRaw) {
          const tenants = await Promise.all(
            tenantsRaw.map(async (tenant: tenant) => {
              return {
                id: tenant.id,
                name: tenant.name,
                phoneNumber: tenant.phoneNumber,
                phoneNumber2: tenant.phoneNumber2 || '',
                email: tenant.email || '',
                description: tenant.description || '',
                SelectedAgreement: tenant.SelectedAgreement,
                RentingOrOut: tenant.RentingOrOut,
                startTime: tenant.startTime,
                endTime: tenant.endTime || 0,
                agreedPrice: tenant.agreedPrice,
                TIN: tenant.TIN || '',
                RentReason: tenant.RentReason || '',
                AddedTime: tenant.AddedTime,
                Currency: tenant.Currency || GetDefaultCurrency(),
              };
            })
          );
          setTenantList(await tenants);
        }
      } catch (error: any) {
        console.log(error.message);
      }
    };
    addTenantApi = async (
      id: string,
      name: string,
      phoneNumber: string,
      phoneNumber2: string,
      email: string,
      description: string,
      SelectedAgreement: string,
      RentingOrOut: string,
      startTime: number,
      endTime: string,
      agreedPrice: string,
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
        // Update the TenantList and set the state to indicate that the update is complete
        await this.getTenantsApi();
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
          getOriginlPropertyValue(TenantList, tenantId, propertyName)
        );
        this.getTenantsApi();
        roomAPI.getRoomFromApi();
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
          getOriginlPropertyValue(TenantList, tenantId, propertyName)
        );
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
        let useBranchId = window.electron.store.get('SelectedBranchId');

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
        const agreementsRaw = await getValuesWithSql(
          'agreements',
          `WHERE 1 AND branchId = '${SelectedBranchId}'`
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
        const agreement = await getValuesWithSql(
          'agreements',
          `WHERE id = '${agreementId}'`
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
        const agreements = await getValuesWithSql(
          'agreements',
          `WHERE roomId = '${roomId}'`
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
      } catch (error: any) {
        console.log(error.message);
      }
    };

    deleteAgreementApi = async (agreementId: string) => {
      try {
        await deleteValue('agreements', agreementId);
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
      const branchId = window.electron.store.get('SelectedBranchId');
      setSelectedBranchId(branchId);
      setBranches(window.electron.store.get('Branches'));

      RefreshDataFromSqlite();
    };
    init();
  }, []);
  const RefreshDataFromSqlite = async () => {
    if (!navigator.onLine) {
      setBranches(window.electron.store.get('Branches'));
    } else {
      await fetchBranches();
    }

    const branchId = window.electron.store.get('SelectedBranchId');
    setSelectedBranchId(branchId);
    if (branchId) {
      roomAPI.getRoomFromApi();
      brokerApi.getBrokersApi();
      tenantAPI.getTenantsApi();
      pastTenantReviewApi.getPastTenantReviewLatestApi();
      brokersRecommendationListApi.getBrokerRecommendationsFromApi();
    } else {
      if (!window.electron.store.get('LockBranchToPc'))
        setViewBranchManagementPage(true);
      else {
        alert(
          'Please select a branch to continue, user is not allowed to switch branches.'
        );
        setViewBranchManagementPage(true);
        setViewBranchManagementPageNONAdm(true);
      }
    }

    getBranchName(branchId);
  };

  const [ThemeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const get = async () => {
      const storedTheme = window.electron.store.get('ThemeMode');
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
    window.electron.store.set('ThemeMode', theme);
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
    window.electron.store.set('MainBackupPath', '');
    window.electron.store.set('SelectedBranchId', '');
    window.electron.store.set('MainBackupPath', '');
    window.electron.store.set('LockBranchToPc', false);
    window.electron.store.set('users', []);
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
    getChanges();
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
      setShowAdvancedUpload(true);
      if (navigator.onLine) {
        await UploadUserFilesToTheOnlineDatabase(
          SelectedUserId,
          setUploadAssetsProgress
        );
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
    useState(false);
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
        const branch = await getValuesWithSql_Online(
          'branches',
          `WHERE id = '${branchId}'`
        );
        if (branch && branch.length > 0) {
          setBranchName(branch[0].name);
        } else {
          console.error('Branch not found');
        }
      } catch (error) {
        console.error('Error fetching branch name:', error);
        setBranchName(window.electron.store.get('BranchName'));
      }
    } else {
      setBranchName(window.electron.store.get('BranchName'));
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
  const fetchBranches = async () => {
    if (navigator.onLine) {
      const branches = await getValuesWithSql_Online(
        'branches',
        `WHERE userId = '${SelectedUserId}'`
      );

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

          // Get all actual payments for the current month
          const today = new Date();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          const monthStart = new Date(currentYear, currentMonth, 1);
          const monthEnd = new Date(currentYear, currentMonth + 1, 0);

          const actualPayments = await getValuesWithSql_Online(
            'room_pay_info',
            `WHERE Day >= ${monthStart.getTime()} 
             AND Day <= ${monthEnd.getTime()} 
             AND branchId = '${branch.id}'
             AND Paid = 1`
          );

          // Get historical payments for the current month
          const historicalPayments = await getValuesWithSql_Online(
            'room_pay_info_history',
            `WHERE Day >= ${monthStart.getTime()} 
             AND Day <= ${monthEnd.getTime()} 
             AND branchId = '${branch.id}'
             AND Paid = 1`
          );

          // Calculate monthly revenue from actual collected payments
          const monthlyRevenue = [
            ...actualPayments,
            ...historicalPayments,
          ].reduce(
            (sum, payment) => parseFloat(sum) + parseFloat(payment.Value),
            0
          );

          // Calculate other branch statistics
          const totalRooms = allRooms.length;
          const totalFloors =
            Math.max(...allRooms.map((room) => room.floor)) === -Infinity
              ? 0
              : Math.max(...allRooms.map((room) => room.floor));
          const totalTenants = allTenants.length;
          const occupiedRooms = allRooms.filter(
            (room) => room.tenantId !== ''
          ).length;
          const vacantRooms = totalRooms - occupiedRooms;

          // Calculate expenses and profit
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
                new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd
            )
            .reduce((sum, e) => sum + parseFloat(e.price), 0);

          const monthlyProfit = monthlyRevenue - monthlyExpenses;

          return {
            ...branch,
            totalRooms,
            totalFloors,
            totalTenants,
            occupiedRooms,
            vacantRooms,
            monthlyRevenue,
            monthlyExpenses,
            monthlyProfit,
            unpaidPastPayments: 0, // This should be calculated if needed
            userAccountsWhichHaveAccess: [], // This should be populated if needed
          };
        })
      );

      setBranches(branchesWithData);
      window.electron.store.set('Branches', branchesWithData);
    } else {
      if (window.electron.store.get('Branches')) {
        setBranches(window.electron.store.get('Branches'));
      }
    }
  };
  const [Branches, setBranches] = useState<BranchTypeWithData[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Start heartbeat
    window.electron.connectionMonitor.startHeartbeat();

    // Listen for connection losses
    window.electron.connectionMonitor.onConnectionLost(() => {
      setIsConnected(false);

      // Show disconnection alert
      notification.error({
        message: 'Connection Lost',
        description:
          'Lost connection to the main process. Attempting to reconnect...',
        duration: 0, // Keep showing until connection is restored
      });

      // Optional: Attempt to reload the page after a delay
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    });
  }, []); // Add this to your App component
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
    <>
      {!isConnected && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#ff4d4f',
            color: 'white',
            padding: '8px',
            textAlign: 'center',
            zIndex: 9999,
          }}
        >
          Connection Lost - Attempting to reconnect...
        </div>
      )}
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
        ViewBranchManagementPage={ViewBranchManagementPage}
        setViewBranchManagementPage={setViewBranchManagementPage}
        SelectedBranchId={SelectedBranchId}
        setSelectedBranchId={setSelectedBranchId}
        setViewBranchManagementPageNONAdm={setViewBranchManagementPageNONAdm}
        ViewBranchManagementPageNONAdm={ViewBranchManagementPageNONAdm}
        fetchBranches={fetchBranches}
        Branches={Branches}
        setBranches={setBranches}
        setBranchName={setBranchName}
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
            setAppUserManagerPromptPassword={setAppUserManagerPromptPassword}
            SelectedAppUser={SelectedAppUser}
            setChangeMade={setChangeMade}
            setViewBranchManagementPage={setViewBranchManagementPage}
          ></NavBar>
          <MainPage
            roomSpecificationAPI={roomSpecificationAPI}
            SelectedPage={SelectedPage}
            setSelectedPage={setSelectedPage}
            RoomList={RoomList}
            setRoomList={setRoomList}
            setTenantList={setTenantList}
            TenantList={TenantList}
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
      </AccountManager>
      {/**/}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
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
  viewRoomsPage: boolean;
  addRoom: boolean;
  editRoomData: boolean;
  editRoomPayment: boolean;
  editUtilityPayments: boolean;
  editTenantRoomTenantInfo: boolean;
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
    viewRoomsPage: false,
    addRoom: false,
    editRoomData: false,
    editRoomPayment: false,
    editUtilityPayments: false,
    editTenantRoomTenantInfo: false,
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
