// src/screens/DocumentManagementDashboard.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
// import { apiService } from '../api';
// import { useCurrentUser } from '../hooks/auth';
// import FolderGrid from './FolderGrid';
// import FolderFormView from './FolderFormView';
// import PaymentSummary from './PaymentSummary';
// import BottomNav from './BottomNav';
import { User, Folder, Document as AppDocument, UserStats, UserDashboardResponse } from '../api/types';
import { apiService } from '@/api';

const DocumentManagementDashboard = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const user = useCurrentUser();
  
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [users, setUsers] = useState<any>(null);
  const [mainView, setMainView] = useState<'home' | 'form' | 'summary'>('home');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchUser();
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    if (users && Array.isArray(users.folder)) {
      fetchFolders();
    }
  }, [users]);

  useEffect(() => {
    if (selectedFolder) {
      fetchDocuments();
    }
  }, [selectedFolder, startDate, endDate]);

  const fetchUser = async () => {
    try {
      if (!user?.id) return;
      
      const userData = await apiService.getUserById(user.id);
      setUsers(userData);
    } catch (error) {
      Alert.alert("Error", "Failed to load user data");
    }
  };

  const fetchFolders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user?.id) throw new Error('User not found');
      
      // This would need to be adjusted based on your actual API endpoint
      const response = await fetch(`${apiService.baseURL}/api/folders?userId=${user.id}&organizationId=${user.organizationId}`);
      const data: UserDashboardResponse = await response.json();
      
      const { folders: fetchedFolders, userStats: fetchedUserStats } = data;
      const userFolderIds = Array.isArray(users?.folder) ? users.folder : [];
      const filteredFolders = fetchedFolders.filter((f: any) => userFolderIds.includes(f.id));
      
      setFolders(filteredFolders);
      setUserStats({
        ...fetchedUserStats,
        totalFolders: filteredFolders.length,
        activeFolders: filteredFolders.filter(f => f.documentCount > 0).length,
        emptyFolders: filteredFolders.filter(f => f.documentCount === 0).length,
      });
      
      if (filteredFolders.length === 1) {
        setSelectedFolder(filteredFolders[0]);
        setMainView('form');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load folders');
      Alert.alert('Error', 'Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      // This would need to be adjusted based on your actual API endpoint
      const response = await fetch(`${apiService.baseURL}/api/documentstype`);
      const data = await response.json();
      setDocumentTypes(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load document types");
    }
  };

  const fetchDocuments = async () => {
    if (!selectedFolder) return;
    
    try {
      let url = `${apiService.baseURL}/api/documents?folderId=${selectedFolder.id}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setDocuments(data || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load documents");
    }
  };

  const handleSelectFolder = (folder: Folder) => {
    setSelectedFolder(folder);
    setMainView('form');
  };

  const handleDateChange = ({ startDate: newStart, endDate: newEnd }: { startDate?: string; endDate?: string }) => {
    if (newStart) setStartDate(newStart);
    if (newEnd) setEndDate(newEnd);
  };

  const payments = documents.map((doc: any) => ({
    id: doc.id,
    amount: doc.metadata?.["Amount"] || doc.metadata?.["Amount Paid"],
    billNo: doc.metadata?.["Bill No"],
    paidTo: doc.metadata?.["Paid to"],
    size: doc.fileSize || 0,
    date: doc.metadata?.["Date Time"],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    userName: doc.metadata?.["User Name"],
    modeOfPayment: doc.metadata?.["Mode Of Payment"],
    purpose: doc.metadata?.["Purpose of Payment"],
    amountPaid: doc.metadata?.["Amount Paid"],
    bankName: doc.metadata?.["Bank Name"],
    accountNo: doc.metadata?.["Account No"],
    cardNo: doc.metadata?.["Card No"],
    uploadImage: doc.metadata?.["Upload Image"],
  }));

  const handleRowClick = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      navigation.navigate('DocumentDetails', { document: doc });
    }
  };

  return (
    <View style={styles.container}>
      {mainView === 'home' && (
        <FolderGrid 
          folders={folders}
          userStats={userStats || {
            totalFolders: 0,
            activeFolders: 0,
            emptyFolders: 0,
            totalDocuments: 0,
            totalStorage: '0 Bytes',
            totalStorageBytes: '0',
            storagePercentage: 0,
            averageStoragePerFolder: '0 Bytes'
          }}
          onFolderSelect={handleSelectFolder}
          loading={isLoading}
          error={error}
        />
      )}
      
      {mainView === 'form' && selectedFolder && (
        <FolderFormView
          folder={selectedFolder}
          documentTypes={documentTypes}
          onShowSummary={() => setMainView('summary')}
        />
      )}
      
      {mainView === 'summary' && selectedFolder && (
        <PaymentSummary
          payments={payments}
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
          onRowClick={handleRowClick}
          folder={selectedFolder}
        />
      )}
      
      <BottomNav
        onHome={() => setMainView('home')}
        onForm={() => setMainView('form')}
        onSummary={() => setMainView('summary')}
        active={mainView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default DocumentManagementDashboard;