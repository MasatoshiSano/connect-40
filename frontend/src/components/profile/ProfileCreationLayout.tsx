import { ReactNode } from 'react';
import { Layout } from '../layout/Layout';
import { Icon } from '../ui/Icon';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';

interface ProfileCreationLayoutProps {
  children: ReactNode;
}

const STEPS = [
  { number: 1, label: '基本情報' },
  { number: 2, label: '興味・趣味' },
  { number: 3, label: '本人確認' },
];

export const ProfileCreationLayout = ({ children }: ProfileCreationLayoutProps) => {
  const { currentStep } = useProfileCreation();

  return (
    <Layout isAuthenticated={true}>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                プロフィール作成
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                あなたの魅力を伝えるプロフィールを作りましょう
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                  />
                </div>

                {/* Step Indicators */}
                {STEPS.map((step) => (
                  <div key={step.number} className="flex flex-col items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-semibold
                        transition-colors duration-200
                        ${
                          step.number === currentStep
                            ? 'bg-primary text-white'
                            : step.number < currentStep
                            ? 'bg-primary text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-2 border-gray-200 dark:border-gray-600'
                        }
                      `}
                    >
                      {step.number < currentStep ? (
                        <Icon name="check" size="sm" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`
                        text-xs mt-2 font-medium
                        ${
                          step.number === currentStep
                            ? 'text-primary'
                            : step.number < currentStep
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400 dark:text-gray-500'
                        }
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-lg p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
