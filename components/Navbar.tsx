// // src/components/NavbarNMC.tsx
// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
// import { Menu, Divider, Portal, PaperProvider } from 'react-native-paper';
// import { useNavigation } from '@react-navigation/native';

// import { apiService } from '../api';
// import { User } from '@/api/types';

// interface NavbarNMCProps {
//   roles: string[];
//   user: User | null;
// }

// const NavbarNMC: React.FC<NavbarNMCProps> = ({ roles, user }) => {
//   const [menuVisible, setMenuVisible] = useState(false);
//   const navigation = useNavigation();

//   const handleLogout = async () => {
//     try {
//       await apiService.logout();
//       navigation.navigate('Login' as never);
//     } catch (error) {
//       console.error('Logout error:', error);
//     }
//   };

//   const handleRoleClick = (role: string) => {
//     // Navigate to the appropriate dashboard based on role
//     navigation.navigate('Dashboard', { screen: role.toLowerCase() } as never);
//     setMenuVisible(false);
//   };

//   const openMenu = () => setMenuVisible(true);
//   const closeMenu = () => setMenuVisible(false);

//   return (
//     <PaperProvider>
//       <View style={styles.navbar}>
//         {/* <Image 
//           source={require('../../assets/gennext.png')} 
//           style={styles.logo}
//           resizeMode="contain"
//         /> */}
        
//         <Menu
//           visible={menuVisible}
//           onDismiss={closeMenu}
//           anchor={
//             <TouchableOpacity onPress={openMenu} style={styles.userButton}>
//               <Text style={styles.userName}>{user?.name || "User"}</Text>
//             </TouchableOpacity>
//           }
//         >
//           <Menu.Item 
//             onPress={() => {}} 
//             title="Switch Roles" 
//             leadingIcon="account-switch"
//           />
//           <Divider />
//           {roles.map((role) => (
//             <Menu.Item
//               key={role}
//               onPress={() => handleRoleClick(role)}
//               title={role}
//               titleStyle={styles.roleItem}
//             />
//           ))}
//           <Divider />
//           <Menu.Item 
//             onPress={handleLogout} 
//             title="Logout" 
//             leadingIcon="logout"
//             titleStyle={styles.logoutItem}
//           />
//         </Menu>
//       </View>
//     </PaperProvider>
//   );
// };

// const styles = StyleSheet.create({
//   navbar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     height: 60,
//     backgroundColor: 'white',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   logo: {
//     width: 96,
//     height: 40,
//   },
//   userButton: {
//     padding: 8,
//     borderRadius: 4,
//   },
//   userName: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#374151',
//   },
//   roleItem: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#374151',
//   },
//   logoutItem: {
//     color: '#dc2626',
//   },
// });

// export default NavbarNMC;

import {
  Image,


  StyleSheet,


  TouchableOpacity,

  View
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from 'react';

const Navbar =()=> {
const [menuVisible, setMenuVisible] = useState(false);
  
  return (
    <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo1}
          />
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
      </View>
  )
}

const styles = StyleSheet.create({
    header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    // paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo1: {
    width: 200,
    height: 60,
    resizeMode: "contain",
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  menuDropdown: {
    position: "absolute",
    top: 90,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
    minWidth: 150,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    fontSize: 14,
    color: "#333",
  },
})

export default Navbar