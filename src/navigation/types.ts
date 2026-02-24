// Navigation type definitions
import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Teams: undefined;
  Invest: undefined;
  Chart: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  AdditionalInfo: undefined;
  Main: NavigatorScreenParams<TabParamList>;
  BattleDetail: { battleId: string };
  CreateBattle: undefined;
  Modal: undefined;
  My: undefined;
  Notifications: undefined;
};
