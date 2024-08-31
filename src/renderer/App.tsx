import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import MainPage from './Project/TSX/MainPage';
import { useEffect, useState } from 'react';
import NavBar from './Project/TSX/Navbar/NavBar';
import LogoImage from './assets/Insert Image Pic.png';
const { v4: uuidv4 } = require('uuid');
import {
  addValue,
  deleteValue,
  getValuesWithSql,
  updateValue,
} from 'Backend/localServerApis';
declare global {}
function Hello() {
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

  class RoomApi {
    getPaymentTimelineInfo = async (roomId: string) => {
      const AllRoomPayInfo = await roomPaymentInfoApi.getRoomPaymentsApi(roomId) || [];
      return AllRoomPayInfo;
    };
    
    getRoomFromApi = async () => {
      const roomsRaw = await getValuesWithSql('rooms', 'WHERE 1');
      if (roomsRaw) {
        const rooms = await Promise.all(
          roomsRaw.map(async (room: RoomType) => {
            const getRoomSpecifications = async () => {
              return roomSpecificationAPI.getRoomSpecificationApi(room.id);
            };

            const roomSpecifications = (await getRoomSpecifications()) || [];
            const AllRoomPayInfo = await this.getPaymentTimelineInfo(room.id);

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
              Archived:room.Archived,
              tenantId: room.tenantId || '',
              AddTenantState: room.AddTenantState || false,
              ViewAgreement: room.ViewAgreement || false,
              ShowPayTimeLine: room.ShowPayTimeLine || false,
              AllRoomPayInfo: { RoomPayInfo: AllRoomPayInfo },
              selectedAgreementId: room.selectedAgreementId || '',
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
    }
    
    editRoomApi = async (
      roomId: string,
      propertyName: string,
      newValue: any
    ) => {
      // wrap around try catch
      try {
        await updateValue('rooms', roomId, propertyName, newValue);
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

      AddRoomFormRoomSpecifications: RoomSpecificationType[]
    ) => {
      try {
        //Add room

        await addValue('rooms', {
          id: roomID,
          floor: AddRoomFormFloor,
          roomIndex: AddRoomFormRoomIndex,
          status: 'Empty',
          price: AddRoomFormPrice,
          AgreedPrice: AddRoomFormPrice,
          PaymentCycleType: AddRoomFormPaymentCycleType,
          PaymentCycleCustomeDays: AddRoomFormPaymentCycleCustomDays,
          squareMeters: AddRoomFormSquareMeters,
          tenantId: '',
          AddTenantState: false,
          ViewAgreement: false,
          ShowPayTimeLine: false,
          selectedAgreementId: '',
        });

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
        await deleteValue('rooms', roomId);
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
        `WHERE roomId = '${roomID}'`
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
        addValue('room_specifications', {
          id: id,
          roomId: roomId,
          Detail: Detail,
          Number: Number,
          type: type,
          Boolean: Boolean,
        });
      } catch (error: any) {
        console.log(error.message);
      }
    };
    editRoomSpecificationApi = async (
      specificationId: string,
      propertyName: string,
      newValue: any
    ) => {
      try {
        await updateValue('room_specifications', specificationId, propertyName, newValue);
       
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
        const tenantsRaw = await getValuesWithSql('tenants', 'WHERE 1');
        if (tenantsRaw) {
          const tenants = await Promise.all(
            tenantsRaw.map(async (tenant: tenant) => {
              return {
                id: tenant.id,
                name: tenant.name,
                phoneNumber: tenant.phoneNumber,
                phoneNumber2: tenant.phoneNumber2 || '',
                email: tenant.email || '',
                SelectedAgreement: tenant.SelectedAgreement,
                RentingOrOut: tenant.RentingOrOut,
                startTime: tenant.startTime,
                endTime: tenant.endTime || 0,
                agreedPrice: tenant.agreedPrice,
                TIN: tenant.TIN || '',
                RentReason: tenant.RentReason || '',
                AddedTime:tenant.AddedTime,
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
      SelectedAgreement: string,
      RentingOrOut: string,
      startTime: string,
      endTime: string,
      agreedPrice: string,
      TIN:string,
      RentReason:string,
      AddedTime:number,
    ) => {
      try {
        await addValue('tenants', {
          id: id,
          name: name,
          phoneNumber: phoneNumber,
          phoneNumber2: phoneNumber2,
          email: email,
          SelectedAgreement: SelectedAgreement,
          RentingOrOut: RentingOrOut,
          startTime: startTime,
          endTime: endTime,
          agreedPrice: agreedPrice,
          TIN: TIN,
          RentReason:RentReason,
          AddedTime:AddedTime,
        });
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
        await updateValue('tenants', tenantId, propertyName, newValue);
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
        await updateValue('tenants', tenantId, propertyName, newValue);
      } catch (error: any) {
        console.log(error.message);
      }
    };
  }
  class RoomPaymentInfoApi {
    getRoomPaymentsApi = async (roomId: string) => {
      const roomPaymentsRaw = await getValuesWithSql(
        'room_pay_info',
        `WHERE roomId = '${roomId}'`
      );
      if (roomPaymentsRaw) {
        return roomPaymentsRaw.map((roomPayment: RoomPayInfo) => {
          return {
            id: roomPayment.id,
            roomId: roomPayment.roomId,
            Day: roomPayment.Day,
            Paid: roomPayment.Paid,
            Value: roomPayment.Value,
          };
        });
      }
    };
    addRoomPaymentApi = async (
      id: string,
      roomId: string,
      Day: string,
      Paid: string,
      Value:number
    ) => {
      try {
        await addValue('room_pay_info', {
          id: id,
          roomId: roomId,
          Day: Day,
          Paid: Paid,
          Value:Value,
        });
        await roomAPI.getRoomFromApi();
      } catch (error: any) {
        console.log(error.message);
      }
    };
    addRoomPaymentApiWithOutRefresh = async (
      id: string,
      roomId: string,
      Day: string,
      Paid: boolean,
      Value: number
    ) => {
      try {
        await addValue('room_pay_info', {
          id: id,
          roomId: roomId,
          Day: Day,
          Paid: Paid,
          Value: Value,
        });
      } catch (error: any) {
        console.log(error.message);
      }
    };
    editRoomPaymentApi = async (
      roomPaymentId: string,
      propertyName: string,
      newValue: any,
      roomId:any,
      lastList:any,
    ) => {
      try {
        await updateValue(
          'room_pay_info',
          roomPaymentId,
          propertyName,
          newValue
        );
        setRoomList(prevRoomList => {
          return prevRoomList.map(room => {
            if (room.id === roomId) {
              const updatedPayInfo = lastList.find((item:any) => item.id === roomPaymentId);
              console.log({ ...room, 'AllRoomPayInfo': { RoomPayInfo: lastList.map((item: { id: string; Paid: any; }) => item.id === roomPaymentId ? { ...item, Paid: !item.Paid } : item) } });
              if (updatedPayInfo) {
                return { ...room, 'AllRoomPayInfo': { RoomPayInfo: lastList.map((item: { id: string; Paid: any; }) => item.id === roomPaymentId ? { ...item, Paid: !item.Paid } : item) } };
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
          `WHERE 1`
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
        const brokersRaw = await getValuesWithSql('brokers', 'WHERE 1');
        if (brokersRaw) {
          const brokers = brokersRaw.map((broker: BrokerType) => {
            return {
              id: broker.id,
              name: broker.name,
              phoneNumber: broker.phoneNumber,
              phoneNumber2: broker.phoneNumber2 || '',
              email: broker.email || '',
              RecommendedTenantsIdList: broker.RecommendedTenantsIdList,
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
        await addValue('brokers', broker);
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
        await updateValue('brokers', brokerId, propertyName, newValue);
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
        await addValue('brokersRecommendationList', {
          id,
          brokerId,
          roomId,
          recommendedTenantId,
          AddedTime,
          AgreedCommission,
        });
      } catch (error: any) {
        console.error(error.message);
      }
    };
    getBrokerRecommendationsFromApi = async () => {
      try {
        const brokerRecommendationsRaw = await getValuesWithSql(
          'brokersRecommendationList',
          'WHERE 1'
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
        const agreementsRaw = await getValuesWithSql('agreements', 'WHERE 1');
        if (agreementsRaw) {
          return agreementsRaw.map((agreement:agreements) => ({
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
            representative:agreement.representative,
          }));
        }
      } catch (error: any) {
        console.log(error.message);
      }
    };

    getAgreementByIdApi = async (agreementId: string) => {
      try {
        const agreement = await getValuesWithSql('agreements', `WHERE id = '${agreementId}'`);
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
        const agreements = await getValuesWithSql('agreements', `WHERE roomId = '${roomId}'`);
        if (agreements && agreements.length > 0) {
          return agreements.map((agreement:agreements) => ({
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
        return [];
      } catch (error: any) {
        console.log(error.message);
        return [];
      }
    };
    editAgreementApi = async (agreementId: string, propertyName: string, newValue: any) => {
      try {
        await updateValue('agreements', agreementId, propertyName, newValue);
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
      representative:string,
    ) => {
      try {
        await addValue('agreements', {
          id,
          roomId,
          tenantId,
          startTime,
          endTime,
          signTime,
          agreedPrice,
          paymentCycleType,
          Memo,
          RentReserved,representative
        });
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
    RefreshDataFromSqlite();
  }, []);
  const RefreshDataFromSqlite = () => {
    roomAPI.getRoomFromApi();
    brokerApi.getBrokersApi();
    tenantAPI.getTenantsApi();
    pastTenantReviewApi.getPastTenantReviewLatestApi();
    brokersRecommendationListApi.getBrokerRecommendationsFromApi();

  };
  const [SelectedPage, setSelectedPage] = useState<
    'Dashboard' | 'People' | 'Rooms' | 'Calendar' | 'Settings' | 'Database'
  >('Rooms');

  const [ThemeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const ChangeTheme = () =>{
    document.body.classList.toggle("DarkTheme");
  }
  return (
    <>
      <NavBar
        ProfileState={false}
        SelectedPage={SelectedPage}
        setSelectedPage={setSelectedPage}
        Image={''}
        ShopName={'The company'}
        ThemeMode={ThemeMode}
        setThemeMode={setThemeMode}ChangeTheme={ChangeTheme}
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
      />
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
