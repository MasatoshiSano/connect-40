import { createContext, useContext, useState, ReactNode } from 'react';

export interface ProfileFormData {
  // Step 1: Basic Info
  nickname: string;
  age: number | null;
  bio: string;

  // Step 2: Interests
  interests: string[];

  // Step 3: Verification
  profilePhoto: File | null;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
}

interface ProfileCreationContextType {
  formData: ProfileFormData;
  updateFormData: (data: Partial<ProfileFormData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resetForm: () => void;
}

const initialFormData: ProfileFormData = {
  nickname: '',
  age: null,
  bio: '',
  interests: [],
  profilePhoto: null,
  location: null,
};

const ProfileCreationContext = createContext<ProfileCreationContextType | undefined>(undefined);

export const ProfileCreationProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);

  const updateFormData = (data: Partial<ProfileFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
  };

  return (
    <ProfileCreationContext.Provider
      value={{
        formData,
        updateFormData,
        currentStep,
        setCurrentStep,
        resetForm,
      }}
    >
      {children}
    </ProfileCreationContext.Provider>
  );
};

export const useProfileCreation = () => {
  const context = useContext(ProfileCreationContext);
  if (context === undefined) {
    throw new Error('useProfileCreation must be used within ProfileCreationProvider');
  }
  return context;
};
