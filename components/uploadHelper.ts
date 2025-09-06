import * as ImagePicker from 'expo-image-picker';
import { apiService } from '@/api';
import { ImageFile } from '@/api/types';

// Upload image from React Native image picker
export const uploadImageFromPicker = async () => {
  try {
    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    // Pick an image
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Fixed deprecated warning
      allowsEditing: true,
      aspect: [1, 1], // Square aspect for profile pics
        quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      const asset = pickerResult.assets[0];
      
      // Prepare the file object for upload
      const imageFile: ImageFile = {
        uri: asset.uri,
        type: asset.mimeType || `image/${asset.uri.split('.').pop()?.toLowerCase() || 'jpeg'}`,
        fileName: asset.fileName || `image_${Date.now()}.${asset.uri.split('.').pop() || 'jpg'}`,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      };

      console.log('Uploading image:', imageFile);
      
      const uploadResult = await apiService.uploadImage(imageFile);
      
      console.log('Upload successful:', uploadResult);
      console.log('Image URL:', uploadResult.url);
      console.log('Optimization:', uploadResult.optimization);
      
      // Use the uploaded image URL
      return uploadResult;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const uploadImageFromFile = async (file: File | ImageFile | any) => {
  try {
    let imageFile: ImageFile;

    // Check if it's an expo-image-picker asset
    if (file.uri && typeof file.uri === 'string' && file.uri.startsWith('file://')) {
      // This is an expo-image-picker asset
      imageFile = {
        uri: file.uri,
        type: file.type || file.mimeType || 'image/jpeg',
        fileName: file.name || file.fileName || `image_${Date.now()}.jpg`,
        fileSize: file.size || file.fileSize || 0,
        width: file.width,
        height: file.height,
      };
    }
    // Check if it's already an ImageFile object
    else if ('uri' in file && file.uri) {
      // Already an ImageFile object
      imageFile = file as ImageFile;
    } 
    // Check if it's a web File object
    else if (file instanceof File || ('size' in file && 'name' in file && 'type' in file)) {
      // Convert File object to ImageFile format
      const fileObj = file as File;
      
      // Create object URL for the file
      const uri = URL.createObjectURL(fileObj);
      
      // Extract file extension
      const fileExtension = fileObj.name.split('.').pop()?.toLowerCase() || 'jpeg';
      
      imageFile = {
        uri: uri,
        type: fileObj.type || `image/${fileExtension}`,
        fileName: fileObj.name || `image_${Date.now()}.${fileExtension}`,
        fileSize: fileObj.size,
        width: undefined, // Will be determined by the API if needed
        height: undefined, // Will be determined by the API if needed
      };
    }
    else {
      throw new Error('Unsupported file format');
    }

    console.log('Uploading image:', imageFile);
    
    const uploadResult = await apiService.uploadImage(imageFile);
    
    // Clean up object URL if we created one
    if (imageFile.uri.startsWith('blob:')) {
      URL.revokeObjectURL(imageFile.uri);
    }
    
    return uploadResult;
    
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Upload image from camera
export const uploadImageFromCamera = async () => {
  try {
    // Request camera permission
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("Permission to access camera is required!");
      return;
    }

    // Take a photo
    const cameraResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Fixed deprecated warning
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!cameraResult.canceled && cameraResult.assets[0]) {
      const asset = cameraResult.assets[0];
      
      const imageFile: ImageFile = {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      };

      const uploadResult = await apiService.uploadImage(imageFile);
      
      console.log('Photo uploaded:', uploadResult);
      return uploadResult;
    }
  } catch (error) {
    console.error('Error taking and uploading photo:', error);
    throw error;
  }
};
