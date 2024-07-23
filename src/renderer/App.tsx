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

function Hello() {
  const [RoomList, setRoomList] = useState<RoomType[]>([]);
  const [TenantList, setTenantList] = useState<tenant[]>([]);
  const [BrokerList, setBrokerList] = useState<BrokerType[]>([]);
  const [PastTenantReviews, setPastTenantReviews] = useState<PastTenantReviewType[]>([]);
  const [isUpdatingTenantList, setIsUpdatingTenantList] = useState(false);

  class RoomApi {
    getRoomFromApi = async () => {
      const roomsRaw = await getValuesWithSql('rooms', 'WHERE 1');
      if (roomsRaw) {
        const rooms = await Promise.all(
          roomsRaw.map(async (room: RoomType) => {
            const getRoomSpecifications = async () => {
              return roomSpecificationAPI.getRoomSpecificationApi(room.id);
            };

            const getRoomPayInfo = async () => {
              return roomPaymentInfoApi.getRoomPaymentsApi(room.id);
            };

            const roomSpecifications = (await getRoomSpecifications()) || [];
            const AllRoomPayInfo = (await getRoomPayInfo()) || [];

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

              tenantId: room.tenantId || '',
              AddTenantState: room.AddTenantState || false,
              ViewAgreement: room.ViewAgreement || false,
              ShowPayTimeLine: room.ShowPayTimeLine || false,
              AllRoomPayInfo: { RoomPayInfo: AllRoomPayInfo },
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
      agreedPrice: string
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
          };
        });
      }
    };
    addRoomPaymentApi = async (
      id: string,
      roomId: string,
      Day: string,
      Paid: string
    ) => {
      try {
        await addValue('room_pay_info', {
          id: id,
          roomId: roomId,
          Day: Day,
          Paid: Paid,
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
      Paid: boolean
    ) => {
      try {
        await addValue('room_pay_info', {
          id: id,
          roomId: roomId,
          Day: Day,
          Paid: Paid,
        });
      } catch (error: any) {
        console.log(error.message);
      }
    };
    editRoomPaymentApi = async (
      roomPaymentId: string,
      propertyName: string,
      newValue: any
    ) => {
      try {
        await updateValue(
          'room_pay_info',
          roomPaymentId,
          propertyName,
          newValue
        );
        roomAPI.getRoomFromApi();
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
        console.log("PAST", pastTenantReviewRaw)
        if (pastTenantReviewRaw) {
          const pastTenantReviews = pastTenantReviewRaw.map((pastTenantReview: PastTenantReviewType) => {
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
          });
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
    AddBrokerRecommendation = async(
      id: string,
      brokerId: string,
      roomId: string,
      recommendedTenantId: string,
      AddedTime: number,
      AgreedCommission: number,
      rating: number,
      notes: string
    ) => {
      try {
        await addValue("brokersRecommendationList", {
          id,
          brokerId,roomId,
          recommendedTenantId,
          AddedTime,
          AgreedCommission,
          rating,
          notes
        })
      } catch (error:any) {
        console.error(error.message);
      }
    }
  } 
  const roomAPI = new RoomApi();
  const brokerApi = new BrokerApi();
  const tenantAPI = new TenantApi();
  const pastTenantReviewApi = new PastTenantReviewApi();
  const roomSpecificationAPI = new RoomSpecificationApi();
  const roomPaymentInfoApi = new RoomPaymentInfoApi();
  const brokersRecommendationListApi = new BrokersRecommendationListApi();
  // On start
  useEffect(() => {
    RefreshDataFromSqlite()
  }, []);
  const RefreshDataFromSqlite = () => {
    roomAPI.getRoomFromApi();
    brokerApi.getBrokersApi();
    tenantAPI.getTenantsApi();
    pastTenantReviewApi.getPastTenantReviewLatestApi();
 
  }
  return (
    <>
      {/** <NavBar
        ProfileState={ProfileEditState}
        SetEditButtonState={setProfileEditState}
        UpdateImageForLogo={handleUpdateImage}
        Image={ComponyLogo}
        ShopName={ComponyName}
        setShopName={setComponyName}
      ></NavBar> */}
      <MainPage
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
