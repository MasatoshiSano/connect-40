import { type ReactNode } from 'react';
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
      <div className="min-h-screen bg-base-50 dark:bg-base py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif font-light tracking-ryokan text-text-primary dark:text-text-dark-primary mb-2">
                プロフィール作成
              </h1>
              <p className="text-text-secondary dark:text-text-dark-secondary font-light">
                あなたの魅力を伝えるプロフィールを作りましょう
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-border-light dark:bg-border-dark -z-10">
                  <div
                    className="h-full bg-gold transition-all duration-base"
                    style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                  />
                </div>

                {/* Step Indicators */}
                {STEPS.map((step) => (
                  <div key={step.number} className="flex flex-col items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-light
                        transition-colors duration-base
                        ${
                          step.number === currentStep
                            ? 'bg-gold/10 text-gold border-2 border-gold'
                            : step.number < currentStep
                            ? 'bg-gold text-base'
                            : 'bg-elevated-light dark:bg-elevated-dark text-text-secondary dark:text-text-dark-muted border-2 border-border-light dark:border-border-dark'
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
                        text-xs mt-2 font-light tracking-ryokan-wide uppercase
                        ${
                          step.number === currentStep
                            ? 'text-gold'
                            : step.number < currentStep
                            ? 'text-text-primary dark:text-text-dark-primary'
                            : 'text-text-muted dark:text-text-dark-muted'
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
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
