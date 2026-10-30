import React from 'react';
import { ActivityIndicator, Text, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SQLiteProvider } from 'expo-sqlite';
import { ThemeProvider, useColors } from './src/theme';
import { RegionProvider } from './src/region';
import Home from './src/screens/Home';
import { IndicatorDetail, IndicatorList } from './src/screens/Indicators';
import { CompanyDetail, CompanyList } from './src/screens/Companies';
import { ServiceDetail, ServiceHome, SphereScreen } from './src/screens/Services';
import Cabinet from './src/screens/Cabinet';
import { IconBuilding, IconChart, IconGrid, IconHome, IconUser } from './src/icons';
import { SampleBadge } from './src/ui';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function stack(screens: [string, React.ComponentType<any>, string][]) {
  return function StackNav() {
    const c = useColors();
    return (
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: c.bg }, headerShadowVisible: false, headerTintColor: c.text, headerTitleStyle: { fontSize: 20, fontWeight: '800' }, contentStyle: { backgroundColor: c.bg } }}>
        {screens.map(([name, comp, title], i) => <Stack.Screen key={name} name={name} component={comp} options={{ title, headerShown: name !== 'Home' }} />)}
      </Stack.Navigator>
    );
  };
}
const HomeStack = stack([['Home', Home, 'Bosh']]);
const IndicatorsStack = stack([['IndicatorList', IndicatorList, "Ko'rsatkichlar"], ['Indicator', IndicatorDetail, "Ko'rsatkich"]]);
const CompaniesStack = stack([['CompanyList', CompanyList, 'Korxonalar'], ['Company', CompanyDetail, 'Korxona']]);
const ServicesStack = stack([['ServiceHome', ServiceHome, 'Xizmatlar'], ['Sphere', SphereScreen, 'Soha'], ['Service', ServiceDetail, 'Xizmat']]);
const CabinetStack = stack([['Cabinet', Cabinet, 'Kabinet']]);

const ICON: Record<string, React.ComponentType<{ color: string; size?: number }>> = { Bosh: IconHome, "Ko'rsatkichlar": IconChart, Korxonalar: IconBuilding, Xizmatlar: IconGrid, Kabinet: IconUser };

function Tabs() {
  const c = useColors();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.brand }}>
      <View style={{ backgroundColor: c.brand, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: c.onBrand, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 }}>my<Text style={{ color: c.accent }}>.</Text>stat<Text style={{ color: c.accent }}>.</Text>uz</Text>
        <SampleBadge />
      </View>
      <Tab.Navigator screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.primary, tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, height: 66, paddingBottom: 10, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => { const I = ICON[route.name]; return <I color={color} size={focused ? 26 : 24} />; },
      })}>
        <Tab.Screen name="Bosh" component={HomeStack} />
        <Tab.Screen name="Ko'rsatkichlar" component={IndicatorsStack} />
        <Tab.Screen name="Korxonalar" component={CompaniesStack} />
        <Tab.Screen name="Xizmatlar" component={ServicesStack} />
        <Tab.Screen name="Kabinet" component={CabinetStack} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

export default function App() {
  const dark = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RegionProvider>
          <React.Suspense fallback={<ActivityIndicator style={{ flex: 1 }} />}>
            <SQLiteProvider databaseName="mystat_demo.db" assetSource={{ assetId: require('./assets/data/mystat_demo.db') }} useSuspense>
              <NavigationContainer theme={dark ? DarkTheme : DefaultTheme}>
                <StatusBar style="light" />
                <Tabs />
              </NavigationContainer>
            </SQLiteProvider>
          </React.Suspense>
        </RegionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
