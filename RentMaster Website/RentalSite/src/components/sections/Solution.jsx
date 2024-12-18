import {
  FaCheckCircle,
  FaBuilding,
  FaUsers,
  FaChartBar,
  FaShieldAlt,
  FaFile,
  FaMoneyBillWave,
} from "react-icons/fa";
import "../../styles/components/solution.css";
import digitalManagement from "../../assets/img/digital-management.jpeg";
import dashboardBg from "../../assets/img/DashboardBG.png";
import MultiplePropertyImage from "../../assets/img/Group 2.png";
import MultiplePeopleImage from "../../assets/img/Group 3.png";
import NotificaionIcon from "../../assets/img/icons8-notification-100 (2) 1.png";
import ExpenseDecreaseIcon from "../../assets/img/icons8-increase-100.png";
import FolderIcon from "../../assets/img/icons8-folder-100.png";
import ExpenseIcon from "../../assets/img/icons8-expense-100.png";

const Solution = () => {
  const solutions = [
    {
      icon: <FaBuilding />,
      title: "Building Management",
      features: [
        "Track all financials in one place",
        "View detailed performance graphs",
        "Identify most profitable rooms",
        "Manage brokers effectively",
        "Track building expenses easily",
      ],
    },
    {
      icon: <FaUsers />,
      title: "Tenant Handling",
      features: [
        "Keep tenant info organized",
        "Send automatic reminders",
        "Save important documents",
        "Track utility payments",
        "Streamlined communication",
      ],
    },
    {
      icon: <FaChartBar />,
      title: "Money Management",
      features: [
        "Track payments easily",
        "Store receipts safely",
        "View income in simple charts",
        "Calculate tax automatically",
        "Handle multiple currencies",
      ],
    },
    {
      icon: <FaShieldAlt />,
      title: "Team Control",
      features: [
        "Different access levels",
        "Everything backed up online",
        "Easy to use interface",
        "Track user activities",
        "Secure data management",
      ],
    },
  ];

  return (
    <section id="features" className="solution">
      <div className="container">
        <h2>Features & Benefits</h2>

        <div className="solution-content">
          <div className="solution-main-benift">
            <div className="inside-main-benift">
              <img
                src={FolderIcon}
                alt="File Icon"
                className="solution-image"
              />
              <h3>Document Managment</h3>
              <p className="solution-description">Securely store and organize all your important documents - from tenant agreements and receipts to property photos and maintenance records</p>
            </div>
          </div>
          <div className="solution-main-benift">
            <div className="inside-main-benift">
              <img
                src={MultiplePropertyImage}
                alt="Multiple Property Management"
                className="solution-image"
              />
              <h3>Manage Multiple Properties</h3>
              <p className="solution-description">Easily manage all your properties in one place. No more switching between different systems!</p>
            </div>
          </div>  
          <div className="solution-main-benift">
            <div className="inside-main-benift">
              <img
                src={NotificaionIcon}
                alt="Smart Notifications" 
                className="solution-image2"
              />
              <h3>Smart Notifications</h3>
              <p className="solution-description">Receive email and SMS notifications for tenant rent payments, utility bills, expense payment dates, and automated reminders sent to representatives</p>
            </div>
          </div>
          <div className="solution-main-benift">
            <div className="inside-main-benift">
              <img
                src={MultiplePeopleImage}
                alt="Team Management"
                className="solution-image"
              />
              <h3>Employee Management</h3>
              <p className="solution-description">Track employee activities and set custom access privileges for different roles to ensure secure and organized team management</p>
            </div>
          </div>
          <div className="solution-main-benift">
            <div className="inside-main-benift">
              <img
                src={ExpenseDecreaseIcon}
                alt="Financial Tracking"
                className="solution-image2"
              />
              <h3>Financial Insights</h3>
              <p className="solution-description">Generate detailed financial reports, and monitor gross revenue all in one place for better financial management</p>
            </div>
          </div>
          <div className="solution-main-benift">
            <div className="inside-main-benift">
              <img
                src={ExpenseIcon}
                alt="Expense Tracking"
                className="solution-image"
              />
              <h3>Expense Tracking</h3>
              <p className="solution-description">Record and categorize expenses, track by property, set budgets and alerts, generate reports, and integrate with your financial tools</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solution;
