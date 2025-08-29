// src/components/NavbarNMC.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Menu, Divider, Portal, PaperProvider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { apiService } from '../api';
import { User } from '@/api/types';

interface NavbarNMCProps {
  roles: string[];
  user: User | null;
}

const NavbarNMC: React.FC<NavbarNMCProps> = ({ roles, user }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await apiService.logout();
      navigation.navigate('Login' as never);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRoleClick = (role: string) => {
    // Navigate to the appropriate dashboard based on role
    navigation.navigate('Dashboard', { screen: role.toLowerCase() } as never);
    setMenuVisible(false);
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  return (
    <PaperProvider>
      <View style={styles.navbar}>
        {/* <Image 
          source={require('../../assets/gennext.png')} 
          style={styles.logo}
          resizeMode="contain"
        /> */}
        
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <TouchableOpacity onPress={openMenu} style={styles.userButton}>
              <Text style={styles.userName}>{user?.name || "User"}</Text>
            </TouchableOpacity>
          }
        >
          <Menu.Item 
            onPress={() => {}} 
            title="Switch Roles" 
            leadingIcon="account-switch"
          />
          <Divider />
          {roles.map((role) => (
            <Menu.Item
              key={role}
              onPress={() => handleRoleClick(role)}
              title={role}
              titleStyle={styles.roleItem}
            />
          ))}
          <Divider />
          <Menu.Item 
            onPress={handleLogout} 
            title="Logout" 
            leadingIcon="logout"
            titleStyle={styles.logoutItem}
          />
        </Menu>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logo: {
    width: 96,
    height: 40,
  },
  userButton: {
    padding: 8,
    borderRadius: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  roleItem: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  logoutItem: {
    color: '#dc2626',
  },
});

export default NavbarNMC;