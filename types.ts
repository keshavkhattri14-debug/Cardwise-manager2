import { NavigatorScreenParams } from "@react-navigation/native";
import { Customer, Transaction } from "@/types";

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Scanner: undefined;
  AIProcessing: { imageUri: string; imageBase64: string };
  ConfirmDetails: {
    extractedData: {
      name: string;
      businessName: string;
      mobile: string;
      email: string;
      address: string;
      businessType: string;
    };
    imageUri: string;
    existingCustomerId?: string;
  };
  CustomerDetail: { customerId: string };
  EditCustomer: { customer: Customer };
  AddTransaction: { customerId: string };
  TransactionDetail: { transaction: Transaction; customerName: string };
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  CustomersTab: NavigatorScreenParams<CustomersStackParamList>;
  AnalyticsTab: NavigatorScreenParams<AnalyticsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type HomeStackParamList = {
  Dashboard: undefined;
};

export type CustomersStackParamList = {
  CustomerList: undefined;
};

export type AnalyticsStackParamList = {
  AnalyticsDashboard: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
};
