import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Building, ArrowRight, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface RegisterProps {
  onRegister: (userData: {
    ownerName: string;
    ownerEmail: string;
    whatsappNumber: string;
    password: string;
    name: string;
    businessType?: string;
    yearsInBusiness?: string;
  }) => void;
  onSwitchToLogin: () => void;
}

export function Register({ onRegister, onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerEmail: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: '',
    name: '',
    businessType: '',
    yearsInBusiness: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }

    if (!formData.ownerEmail) {
      newErrors.ownerEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Please enter a valid email address';
    }

    if (!formData.whatsappNumber) {
      newErrors.whatsappNumber = 'WhatsApp number is required';
    } else if (!/^(07|01|254|\+254)\d{7,12}$/.test(formData.whatsappNumber.replace(/\s/g, ''))) {
      newErrors.whatsappNumber = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const { confirmPassword, ...registrationData } = formData;
      await onRegister(registrationData);
    } catch (error) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-medium">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Unda akaunti / Join NumeraAI today
          </p>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Register
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors.submit}</p>
              )}
              
              {/* Personal Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Personal Information</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Full Name</Label>
                  <Input
                    id="ownerName"
                    placeholder="John Doe"
                    value={formData.ownerName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, ownerName: e.target.value }));
                      clearFieldError('ownerName');
                    }}
                    disabled={isLoading}
                  />
                  {errors.ownerName && (
                    <p className="text-xs text-red-600">{errors.ownerName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="ownerEmail"
                      type="email"
                      placeholder="owner@business.com"
                      value={formData.ownerEmail}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, ownerEmail: e.target.value }));
                        clearFieldError('ownerEmail');
                      }}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.ownerEmail && (
                    <p className="text-xs text-red-600">{errors.ownerEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    placeholder="0712345678"
                    value={formData.whatsappNumber}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }));
                      clearFieldError('whatsappNumber');
                    }}
                    disabled={isLoading}
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Used for receiving AI business insights and managing your shop via WhatsApp.
                  </p>
                  {errors.whatsappNumber && (
                    <p className="text-xs text-red-600">{errors.whatsappNumber}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Security</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, password: e.target.value }));
                        clearFieldError('password');
                      }}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                        clearFieldError('confirmPassword');
                      }}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Business Information</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Your business name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, name: e.target.value }));
                        clearFieldError('name');
                      }}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select 
                    value={formData.businessType} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, businessType: value }));
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retail Store">Retail Store</SelectItem>
                      <SelectItem value="Restaurant">Restaurant</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Agriculture">Agriculture</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Transportation">Transportation</SelectItem>
                      <SelectItem value="Beauty & Health">Beauty & Health</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsInBusiness">Years in Business</Label>
                  <Select 
                    value={formData.yearsInBusiness} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, yearsInBusiness: value }));
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">Less than 1 year</SelectItem>
                      <SelectItem value="1-2">1-2 years</SelectItem>
                      <SelectItem value="2-5">2-5 years</SelectItem>
                      <SelectItem value="5-10">5-10 years</SelectItem>
                      <SelectItem value="10+">More than 10 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Register Button */}
              <Button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Switch to Login */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-medium"
              disabled={isLoading}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
