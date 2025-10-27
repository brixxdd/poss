import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dixdu7cb4';
const CLOUDINARY_API_KEY = '526157387492199';
const CLOUDINARY_API_SECRET = 'NWedsvlwnEPmg-iL0CBqS8qwOFo';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_FOLDER = 'pos-products'; // Folder to organize uploads

/**
 * Request camera and library permissions
 */
export const requestImagePermissions = async () => {
  try {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

/**
 * Pick an image from the gallery or camera
 */
export const pickImage = async (): Promise<string | null> => {
  try {
    // Request permissions first
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      throw new Error('No se otorgaron permisos para acceder a la galería');
    }

    // Show action sheet
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true, // Get base64 for Cloudinary
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error: any) {
    console.error('Error picking image:', error);
    throw new Error(error.message || 'Error al seleccionar la imagen');
  }
};

/**
 * Upload image to Cloudinary using base64
 */
export const uploadToCloudinary = async (imageUri: string): Promise<string> => {
  try {
    // Get image info
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: mimeType,
      name: `photo.${fileType}`,
    } as any);
    formData.append('upload_preset', 'poseasy');
    formData.append('folder', CLOUDINARY_FOLDER);

    console.log('Uploading to Cloudinary...');
    console.log('Preset:', 'poseasy');
    console.log('Folder:', CLOUDINARY_FOLDER);

    const response = await axios.post(
      CLOUDINARY_UPLOAD_URL,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Upload response:', response.data);

    if (response.data && response.data.secure_url) {
      return response.data.secure_url;
    }

    throw new Error('No se pudo obtener la URL de la imagen');
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    if (error.response) {
      console.error('Error details:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    throw new Error(error.message || 'Error al subir la imagen');
  }
};



/**
 * Complete workflow: pick and upload image
 */
export const pickAndUploadImage = async (): Promise<string | null> => {
  try {
    // Pick image
    const imageUri = await pickImage();
    if (!imageUri) {
      return null;
    }

    // Upload to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(imageUri);
    return cloudinaryUrl;
  } catch (error: any) {
    console.error('Error in pickAndUploadImage:', error);
    throw error;
  }
};
