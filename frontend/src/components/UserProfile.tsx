import React, { useState, useEffect } from 'react';
import { User, Edit3, Shield, CreditCard, Phone, MapPin, Building, Calendar, Star, Trophy, TrendingUp, CheckCircle, AlertCircle, Wallet, Heart, Smartphone, Plus, LogOut, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useBusiness } from '../hooks/api/useBusiness';

interface UserData {
  id?: number;
  firstName: string;
  lastName: string;
  businessName: string;
  phone: string;
  location: string;
  businessType: string;
  yearsInBusiness: string;
  avatar?: string;
  businessId?: number;
}

interface MobileMoneyData {
  mpesaNumber: string;
  airtelNumber: string;
}

interface UserProfileProps {
  initialUserData?: Partial<UserData>;
  onLogout?: () => void;
}

interface LoanEligibility {
  eligible: boolean;
  maxAmount: number;
  interestRate: number;
  term: number;
  trustScore: number;
  factors: {
    paymentHistory: number;
    businessStability: number;
    transactionVolume: number;
    customerRatings: number;
  };
}

interface SACCO {
  id: string;
  name: string;
  description: string;
  location: string;
  memberCount: number;
  maxLoanAmount: number;
  interestRate: number;
  requirements: string[];
  compatibilityScore: number;
  logo: string;
}

const mockUserData: UserData = {
  firstName: 'Grace',
  lastName: 'Wanjiku',
  businessName: 'Grace Agrovet & Animal Feeds',
  phone: '+254712345678',
  location: 'Nairobi, Kenya',
  businessType: 'Agrovet',
  yearsInBusiness: '3'
};

const mockMobileMoneyData: MobileMoneyData = {
  mpesaNumber: '+254712345678',
  airtelNumber: ''
};

const mockLoanData: LoanEligibility = {
  eligible: true,
  maxAmount: 50000,
  interestRate: 12,
  term: 6,
  trustScore: 78,
  factors: {
    paymentHistory: 85,
    businessStability: 75,
    transactionVolume: 80,
    customerRatings: 72
  }
};

const mockSACCOs: SACCO[] = [
  {
    id: '1',
    name: 'Nairobi Business SACCO',
    description: 'Leading SACCO for Nairobi business owners with competitive rates',
    location: 'Nairobi CBD',
    memberCount: 2500,
    maxLoanAmount: 100000,
    interestRate: 10,
    requirements: ['3+ years in business', 'Monthly turnover > KES 50,000', 'Good credit history'],
    compatibilityScore: 92,
    logo: '🏢'
  },
  {
    id: '2',
    name: 'Kenya Agrovet SACCO',
    description: 'Specialized SACCO for agricultural and agrovet businesses',
    location: 'Nakuru',
    memberCount: 1800,
    maxLoanAmount: 75000,
    interestRate: 11,
    requirements: ['Agrovet license', '2+ years experience', 'Regular agricultural suppliers'],
    compatibilityScore: 88,
    logo: '🌾'
  },
  {
    id: '3',
    name: 'Cooperative Bank SACCO',
    description: 'Large cooperative with extensive branch network',
    location: 'Nationwide',
    memberCount: 5000,
    maxLoanAmount: 150000,
    interestRate: 12,
    requirements: ['Business registration', '6 months bank statements', 'Collateral or guarantor'],
    compatibilityScore: 75,
    logo: '🏦'
  },
  {
    id: '4',
    name: 'Women Enterprise SACCO',
    description: 'SACCO focused on women-owned businesses',
    location: 'Nairobi & Mombasa',
    memberCount: 3200,
    maxLoanAmount: 60000,
    interestRate: 9,
    requirements: ['Women-owned business', '1+ year in operation', 'Business plan'],
    compatibilityScore: 85,
    logo: '👩‍💼'
  },
  {
    id: '5',
    name: 'Youth Enterprise SACCO',
    description: 'Supporting young entrepreneurs under 35 years',
    location: 'Multiple locations',
    memberCount: 1500,
    maxLoanAmount: 40000,
    interestRate: 8,
    requirements: ['Under 35 years', 'Business registration', 'Youth enterprise certificate'],
    compatibilityScore: 70,
    logo: '青年'
  }
];

const achievements = [
  { title: 'Consistent Earner', description: '6 months of steady revenue', icon: Trophy, earned: true },
  { title: 'Payment Master', description: 'No late payments in 3 months', icon: CheckCircle, earned: true },
  { title: 'Growth Champion', description: '20% month-over-month growth', icon: TrendingUp, earned: false },
  { title: 'Customer Favorite', description: '4.5+ customer rating', icon: Heart, earned: true }
];

export function UserProfile({ initialUserData, onLogout }: UserProfileProps) {
  // Merge initial data with mock data, prioritizing initial data
  const mergedUserData: UserData = {
    ...mockUserData,
    ...initialUserData,
    location: initialUserData?.location || 'Nairobi, Kenya' // Default location if not provided
  };

  const [userData, setUserData] = useState<UserData>(mergedUserData);
  const [loanData] = useState<LoanEligibility>(mockLoanData);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData>(mergedUserData);
  const [mobileMoneyData, setMobileMoneyData] = useState<MobileMoneyData>(mockMobileMoneyData);
  const [isEditingMobileMoney, setIsEditingMobileMoney] = useState(false);
  const [editedMobileMoneyData, setEditedMobileMoneyData] = useState<MobileMoneyData>(mockMobileMoneyData);
  const [showSACCOSelection, setShowSACCOSelection] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrustScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Fair';
  };

  const getSACCOCompatibilityColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSACCOCompatibilityLabel = (score: number) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Good Match';
    if (score >= 50) return 'Fair Match';
    return 'Low Match';
  };

  const handleSaveProfile = () => {
    setUserData(editedData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedData(userData);
    setIsEditing(false);
  };

  const handleSaveMobileMoney = () => {
    setMobileMoneyData(editedMobileMoneyData);
    setIsEditingMobileMoney(false);
  };

  const handleCancelMobileMoneyEdit = () => {
    setEditedMobileMoneyData(mobileMoneyData);
    setIsEditingMobileMoney(false);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2>Profile</h2>
        <p className="text-muted-foreground text-sm">
          Wasifu wako / Your business profile
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="credit">Credit</TabsTrigger>
          <TabsTrigger value="achievements">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userData.firstName[0]}{userData.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3>{userData.firstName} {userData.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{userData.businessName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{userData.location}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  {onLogout && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onLogout}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={editedData.firstName}
                        onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editedData.lastName}
                        onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={editedData.businessName}
                      onChange={(e) => setEditedData({ ...editedData, businessName: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editedData.phone}
                      onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={editedData.location}
                      onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select value={editedData.businessType} onValueChange={(value) => setEditedData({ ...editedData, businessType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Retail Store">Retail Store</SelectItem>
                        <SelectItem value="Restaurant">Restaurant</SelectItem>
                        <SelectItem value="Services">Services</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Agriculture">Agriculture</SelectItem>
                        <SelectItem value="Agrovet">Agrovet/Animal Feed Store</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="years">Years in Business</Label>
                    <Select value={editedData.yearsInBusiness} onValueChange={(value) => setEditedData({ ...editedData, yearsInBusiness: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 years</SelectItem>
                        <SelectItem value="1-2">1-2 years</SelectItem>
                        <SelectItem value="2-5">2-5 years</SelectItem>
                        <SelectItem value="5+">5+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveProfile} className="flex-1">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{userData.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{userData.businessType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{userData.yearsInBusiness} years in business</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Money Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile Money Integration
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingMobileMoney(!isEditingMobileMoney)}
                  className="ml-auto"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect your M-Pesa or Airtel Money for seamless transactions
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingMobileMoney ? (
                <>
                  <div>
                    <Label htmlFor="mpesa">M-Pesa Number</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="mpesa"
                          placeholder="+254712345678"
                          value={editedMobileMoneyData.mpesaNumber}
                          onChange={(e) => setEditedMobileMoneyData({ 
                            ...editedMobileMoneyData, 
                            mpesaNumber: e.target.value 
                          })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="airtel">Airtel Money Number</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="airtel"
                          placeholder="+254701234567"
                          value={editedMobileMoneyData.airtelNumber}
                          onChange={(e) => setEditedMobileMoneyData({ 
                            ...editedMobileMoneyData, 
                            airtelNumber: e.target.value 
                          })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveMobileMoney} className="flex-1">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancelMobileMoneyEdit}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {/* M-Pesa */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-medium text-sm">MP</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">M-Pesa</p>
                        <p className="text-xs text-muted-foreground">
                          {mobileMoneyData.mpesaNumber || 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {mobileMoneyData.mpesaNumber ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Airtel Money */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-700 font-medium text-sm">AM</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Airtel Money</p>
                        <p className="text-xs text-muted-foreground">
                          {mobileMoneyData.airtelNumber || 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {mobileMoneyData.airtelNumber ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Benefits Info */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Benefits of connecting:</p>
                        <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
                          <li>• Automatic payment tracking</li>
                          <li>• Faster transaction processing</li>
                          <li>• Improved credit score calculations</li>
                          <li>• Real-time sales notifications</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit" className="space-y-4">
          {/* Trust Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Trust Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className={`text-4xl font-medium ${getTrustScoreColor(loanData.trustScore)}`}>
                  {loanData.trustScore}
                </div>
                <p className="text-sm text-muted-foreground">
                  {getTrustScoreLabel(loanData.trustScore)} Credit Rating
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Payment History</span>
                    <span>{loanData.factors.paymentHistory}%</span>
                  </div>
                  <Progress value={loanData.factors.paymentHistory} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Business Stability</span>
                    <span>{loanData.factors.businessStability}%</span>
                  </div>
                  <Progress value={loanData.factors.businessStability} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Transaction Volume</span>
                    <span>{loanData.factors.transactionVolume}%</span>
                  </div>
                  <Progress value={loanData.factors.transactionVolume} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Customer Ratings</span>
                    <span>{loanData.factors.customerRatings}%</span>
                  </div>
                  <Progress value={loanData.factors.customerRatings} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan Eligibility */}
          <Card className={loanData.eligible ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Loan Eligibility
                {loanData.eligible ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loanData.eligible ? (
                showSACCOSelection ? (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="font-medium text-green-700 mb-2">Choose Your SACCO</h3>
                      <p className="text-sm text-muted-foreground">
                        Select the SACCO that best matches your business needs
                      </p>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {mockSACCOs
                        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
                        .map((sacco) => (
                        <div key={sacco.id} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                              {sacco.logo}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{sacco.name}</h4>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSACCOCompatibilityColor(sacco.compatibilityScore)}`}>
                                  {sacco.compatibilityScore}% Match
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground mb-2">{sacco.description}</p>

                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Max Loan</p>
                                  <p className="font-medium text-sm">{formatCurrency(sacco.maxLoanAmount)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Interest Rate</p>
                                  <p className="font-medium text-sm">{sacco.interestRate}%</p>
                                </div>
                              </div>

                              <div className="mb-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Requirements:</p>
                                <div className="flex flex-wrap gap-1">
                                  {sacco.requirements.slice(0, 2).map((req, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {req}
                                    </Badge>
                                  ))}
                                  {sacco.requirements.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{sacco.requirements.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                  📍 {sacco.location} • 👥 {sacco.memberCount.toLocaleString()} members
                                </div>
                                <Button size="sm" className="text-xs">
                                  Apply Here
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setShowSACCOSelection(false)}
                        className="w-full"
                      >
                        Back to Loan Summary
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-medium text-green-600">
                          {formatCurrency(loanData.maxAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">Maximum Amount</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-medium text-green-600">
                          {loanData.interestRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">Interest Rate</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Loan Term: {loanData.term} months
                      </p>
                    </div>

                    <div className="p-3 bg-white/70 rounded-lg">
                      <p className="text-xs text-green-700 mb-2">
                        🎉 Congratulations! You're eligible for a business loan.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Monthly repayment would be approximately {formatCurrency(Math.round((loanData.maxAmount * (1 + loanData.interestRate / 100)) / loanData.term))}
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => setShowSACCOSelection(true)}
                    >
                      Apply for Loan
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-center">
                  <p className="text-sm text-red-600 mb-2">
                    You're not currently eligible for a loan.
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Improve your trust score by maintaining consistent sales and payments.
                  </p>
                  <Button variant="outline" className="w-full">
                    Learn How to Improve
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Improve Your Credit Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <p className="text-sm">Make all M-Pesa payments on time</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <p className="text-sm">Maintain steady business transactions</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <p className="text-sm">Keep good relationships with suppliers</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <p className="text-sm">Update your business information regularly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Business Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {achievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        achievement.earned
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-muted/30 border border-muted'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.earned
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                      {achievement.earned && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Earned
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Next Achievement */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-700">Next Achievement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Growth Champion</h4>
                  <p className="text-xs text-muted-foreground">
                    Achieve 20% month-over-month growth
                  </p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>15%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}