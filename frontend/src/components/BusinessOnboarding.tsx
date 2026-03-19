import React, { useState } from 'react';
import { Building, User, Phone, Briefcase, Calendar, ArrowRight, Shield, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useCreateBusiness } from '../hooks/api/useBusiness';
import { toast } from 'sonner';

interface OnboardingData {
  firstName: string;
  lastName: string;
  phone: string;
  businessName: string;
  businessType: string;
  yearsInBusiness: string;
  mpesaShortcode: string;
  businessId?: number;
}

interface BusinessOnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

const businessTypes = [
  'Retail Store',
  'Restaurant',
  'Services',
  'Manufacturing',
  'Agriculture',
  'Agrovet/Animal Feed Store',
  'Transportation',
  'Beauty Salon',
  'Electronics',
  'Clothing',
  'Pharmacy',
  'Hardware Store',
  'Mobile Money Agent',
  'Other'
];

const yearsOptions = [
  { value: '0-1', label: 'Less than 1 year' },
  { value: '1-2', label: '1-2 years' },
  { value: '2-5', label: '2-5 years' },
  { value: '5-10', label: '5-10 years' },
  { value: '10+', label: 'More than 10 years' }
];

export function BusinessOnboarding({ onComplete }: BusinessOnboardingProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    phone: '',
    businessName: '',
    businessType: '',
    yearsInBusiness: '',
    mpesaShortcode: ''
  });
  const [errors, setErrors] = useState<Partial<OnboardingData>>({});

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<OnboardingData> = {};

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      else if (!/^\+?[0-9]{10,13}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    if (currentStep === 2) {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
      if (!formData.businessType) newErrors.businessType = 'Please select a business type';
      if (!formData.yearsInBusiness) newErrors.yearsInBusiness = 'Please select your experience';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(2);
    }
  };

  const { mutate: createBusiness, isPending } = useCreateBusiness();

  const handleComplete = () => {
    if (validateStep(step)) {
      createBusiness({
        name: formData.businessName,
        ownerName: `${formData.firstName} ${formData.lastName}`,
        ownerEmail: `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}.${Date.now()}@example.com`,
        mpesaShortcode: formData.mpesaShortcode,
        metadata: {
          businessType: formData.businessType,
          yearsInBusiness: formData.yearsInBusiness,
          phone: formData.phone
        }
      }, {
        onSuccess: (data) => {
          toast.success('Business created successfully!');
          onComplete({ ...formData, businessId: data.id });
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to create business');
        }
      });
    }
  };

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-medium">NumeraAI</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {step === 1 ? 'Taarifa za kibinafsi / Personal Information' : 'Taarifa za biashara / Business Information'}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-md mx-auto w-full p-4">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <div className={`w-12 h-0.5 ${step > 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 max-w-md mx-auto w-full p-4">
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Details
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Let's start with your personal information
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Grace"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName ? 'border-destructive' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Wanjiku"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? 'border-destructive' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+254712345678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive mt-1">{errors.phone}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  We'll use this for M-Pesa integration and notifications
                </p>
              </div>

              <Button onClick={handleNext} className="w-full">
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business Information
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Tell us about your business
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="businessName"
                    placeholder="Grace General Store"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className={`pl-10 ${errors.businessName ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.businessName && (
                  <p className="text-xs text-destructive mt-1">{errors.businessName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                  <SelectTrigger className={errors.businessType ? 'border-destructive' : ''}>
                    <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.businessType && (
                  <p className="text-xs text-destructive mt-1">{errors.businessType}</p>
                )}
              </div>

              <div>
                <Label htmlFor="yearsInBusiness">Years of Experience *</Label>
                <Select value={formData.yearsInBusiness} onValueChange={(value) => handleInputChange('yearsInBusiness', value)}>
                  <SelectTrigger className={errors.yearsInBusiness ? 'border-destructive' : ''}>
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="How long have you been in business?" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.yearsInBusiness && (
                  <p className="text-xs text-destructive mt-1">{errors.yearsInBusiness}</p>
                )}
              </div>

              <div>
                <Label htmlFor="mpesaShortcode">M-Pesa Shortcode (Optional)</Label>
                <Input
                  id="mpesaShortcode"
                  placeholder="e.g., 174379 (Paybill/Till)"
                  value={formData.mpesaShortcode}
                  onChange={(e) => handleInputChange('mpesaShortcode', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your Paybill or Till number to enable automatic payments
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleComplete} className="flex-1" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Complete Setup
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Welcome Message */}
      <div className="max-w-md mx-auto w-full p-4 text-center">
        <p className="text-xs text-muted-foreground">
          {step === 1 
            ? 'Join thousands of African businesses using AI to grow'
            : 'Almost done! We\'ll use this to personalize your experience'
          }
        </p>
      </div>
    </div>
  );
}