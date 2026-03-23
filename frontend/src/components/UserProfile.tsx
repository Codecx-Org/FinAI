import React, { useState } from 'react';
import {
  User, Edit3, Shield, Phone, MapPin, Building, Calendar,
  Star, Trophy, TrendingUp, CheckCircle, Heart, Smartphone,
  Plus, LogOut, Bot, ExternalLink, Info, Landmark, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
}

interface UserProfileProps {
  initialUserData?: Partial<UserData>;
  onLogout?: () => void;
  businessId?: number;
  onOpenAICoach?: () => void;
}

const mockUserData: UserData = {
  firstName: 'Grace',
  lastName: 'Wanjiku',
  businessName: 'Grace Agrovet & Animal Feeds',
  phone: '+254712345678',
  location: 'Nairobi, Kenya',
  businessType: 'Agrovet',
  yearsInBusiness: '3',
};

const mockMobileMoneyData: MobileMoneyData = { mpesaNumber: '+254712345678' };

// ─── Real Kenyan bank & SACCO loan products ───────────────────────────────────
const LOAN_PRODUCTS = [
  {
    id: '1',
    institution: 'KCB Bank',
    logo: '🏦',
    product: 'KCB Biashara Loan',
    type: 'bank',
    maxAmount: 1_000_000,
    interestRate: '13% p.a.',
    term: 'Up to 36 months',
    requirements: ['Business registration', '6 months bank statements', 'KRA PIN'],
    applyUrl: 'https://www.kcbgroup.com/business/borrowing/business-loan/',
    tag: 'Popular',
    tagColor: 'bg-blue-100 text-blue-700',
    suitedFor: ['Retail Store', 'Restaurant', 'Services', 'Manufacturing', 'Agrovet', 'Agriculture', 'Other'],
  },
  {
    id: '2',
    institution: 'Equity Bank',
    logo: '🏦',
    product: 'Equity Biashara Loan',
    type: 'bank',
    maxAmount: 500_000,
    interestRate: '14% p.a.',
    term: 'Up to 24 months',
    requirements: ['Equity account (3+ months)', 'Business permit', 'KRA PIN'],
    applyUrl: 'https://equitygroupholdings.com/ke/borrow/sme-loans/',
    tag: 'Fast Approval',
    tagColor: 'bg-green-100 text-green-700',
    suitedFor: ['Retail Store', 'Restaurant', 'Services', 'Agrovet', 'Agriculture', 'Other'],
  },
  {
    id: '3',
    institution: 'Co-operative Bank',
    logo: '🏦',
    product: 'Co-op Biashara Loan',
    type: 'bank',
    maxAmount: 3_000_000,
    interestRate: '12.5% p.a.',
    term: 'Up to 48 months',
    requirements: ['Co-op account', '1 year business history', 'Security/Guarantor'],
    applyUrl: 'https://www.co-opbank.co.ke/business-banking/loans/',
    tag: 'High Limit',
    tagColor: 'bg-purple-100 text-purple-700',
    suitedFor: ['Manufacturing', 'Agrovet', 'Agriculture', 'Services', 'Other'],
  },
  {
    id: '4',
    institution: 'Stanbic Bank',
    logo: '🏦',
    product: 'SME Business Loan',
    type: 'bank',
    maxAmount: 5_000_000,
    interestRate: '13.5% p.a.',
    term: 'Up to 60 months',
    requirements: ['2 years audited accounts', 'Business registration', 'Security'],
    applyUrl: 'https://www.stanbicbank.co.ke/kenya/business/products-and-services/borrow/sme-loans',
    tag: 'Large Loans',
    tagColor: 'bg-orange-100 text-orange-700',
    suitedFor: ['Manufacturing', 'Agriculture', 'Services', 'Other'],
  },
  {
    id: '5',
    institution: 'Nairobi Business SACCO',
    logo: '🤝',
    product: 'Business Development Loan',
    type: 'sacco',
    maxAmount: 100_000,
    interestRate: '10% p.a.',
    term: 'Up to 12 months',
    requirements: ['SACCO membership', '3+ months savings', 'Business permit'],
    applyUrl: 'https://www.nairobibusinesssacco.com/',
    tag: 'Low Interest',
    tagColor: 'bg-teal-100 text-teal-700',
    suitedFor: ['Retail Store', 'Restaurant', 'Services', 'Agrovet', 'Agriculture', 'Other'],
  },
  {
    id: '6',
    institution: 'Kenya Agrovet SACCO',
    logo: '🌾',
    product: 'Agri-Business Loan',
    type: 'sacco',
    maxAmount: 75_000,
    interestRate: '11% p.a.',
    term: 'Up to 12 months',
    requirements: ['Agrovet license', '2+ months savings', 'Regular supplier receipts'],
    applyUrl: '#',
    tag: 'Agrovet Specialist',
    tagColor: 'bg-green-100 text-green-700',
    suitedFor: ['Agrovet', 'Agriculture'],
  },
  {
    id: '7',
    institution: 'Women Enterprise Fund',
    logo: '👩‍💼',
    product: 'WEF Business Loan',
    type: 'government',
    maxAmount: 500_000,
    interestRate: '8% p.a.',
    term: 'Up to 36 months',
    requirements: ['Women-owned business', 'Business registration', 'Group or individual'],
    applyUrl: 'https://www.wef.co.ke/',
    tag: 'Government',
    tagColor: 'bg-yellow-100 text-yellow-700',
    suitedFor: ['Retail Store', 'Restaurant', 'Services', 'Agrovet', 'Agriculture', 'Other'],
  },
  {
    id: '8',
    institution: 'Youth Enterprise Fund',
    logo: '🚀',
    product: 'Youth Business Loan',
    type: 'government',
    maxAmount: 300_000,
    interestRate: '8% p.a.',
    term: 'Up to 36 months',
    requirements: ['Under 35 years', 'Business registration', 'Business plan'],
    applyUrl: 'https://www.youthfund.go.ke/',
    tag: 'Government',
    tagColor: 'bg-yellow-100 text-yellow-700',
    suitedFor: ['Retail Store', 'Restaurant', 'Services', 'Agrovet', 'Agriculture', 'Other'],
  },
];

const achievements = [
  { title: 'Consistent Earner',  description: '6 months of steady revenue',      icon: Trophy,      earned: true  },
  { title: 'Payment Master',     description: 'No late payments in 3 months',    icon: CheckCircle, earned: true  },
  { title: 'Growth Champion',    description: '20% month-over-month growth',      icon: TrendingUp,  earned: false },
  { title: 'Customer Favorite',  description: '4.5+ customer rating',            icon: Heart,       earned: true  },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function UserProfile({ initialUserData, onLogout, businessId, onOpenAICoach }: UserProfileProps) {
  const mergedUserData: UserData = {
    ...mockUserData,
    ...initialUserData,
    location: initialUserData?.location || 'Nairobi, Kenya',
  };

  const [userData, setUserData]                         = useState<UserData>(mergedUserData);
  const [isEditing, setIsEditing]                       = useState(false);
  const [editedData, setEditedData]                     = useState<UserData>(mergedUserData);
  const [mobileMoneyData, setMobileMoneyData]           = useState<MobileMoneyData>(mockMobileMoneyData);
  const [isEditingMobileMoney, setIsEditingMobileMoney] = useState(false);
  const [editedMobileMoneyData, setEditedMobileMoneyData] = useState<MobileMoneyData>(mockMobileMoneyData);
  const [loanFilter, setLoanFilter]                     = useState<'all' | 'bank' | 'sacco' | 'government'>('all');

  const handleSaveProfile = () => { setUserData(editedData); setIsEditing(false); };
  const handleCancelEdit  = () => { setEditedData(userData); setIsEditing(false); };
  const handleSaveMobileMoney   = () => { setMobileMoneyData(editedMobileMoneyData); setIsEditingMobileMoney(false); };
  const handleCancelMobileMoneyEdit = () => { setEditedMobileMoneyData(mobileMoneyData); setIsEditingMobileMoney(false); };

  // Filter loans by type AND business type
  const filteredLoans = LOAN_PRODUCTS.filter(loan => {
    const typeMatch = loanFilter === 'all' || loan.type === loanFilter;
    const businessMatch = loan.suitedFor.includes(userData.businessType) || loan.suitedFor.includes('Other');
    return typeMatch && businessMatch;
  });

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <h2>Profile</h2>
        <p className="text-muted-foreground text-sm">Wasifu wako / Your business profile</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="credit">Loans</TabsTrigger>
          <TabsTrigger value="achievements">Rewards</TabsTrigger>
        </TabsList>

        {/* ── PROFILE TAB ── */}
        <TabsContent value="profile" className="space-y-4">
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
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  {onLogout && (
                    <Button variant="outline" size="sm" onClick={onLogout} className="text-red-600 border-red-200 hover:bg-red-50">
                      <LogOut className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-4 h-4" />Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={editedData.firstName} onChange={e => setEditedData({ ...editedData, firstName: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={editedData.lastName} onChange={e => setEditedData({ ...editedData, lastName: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input id="businessName" value={editedData.businessName} onChange={e => setEditedData({ ...editedData, businessName: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={editedData.phone} onChange={e => setEditedData({ ...editedData, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={editedData.location} onChange={e => setEditedData({ ...editedData, location: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select value={editedData.businessType} onValueChange={value => setEditedData({ ...editedData, businessType: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Select value={editedData.yearsInBusiness} onValueChange={value => setEditedData({ ...editedData, yearsInBusiness: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 years</SelectItem>
                        <SelectItem value="1-2">1-2 years</SelectItem>
                        <SelectItem value="2-5">2-5 years</SelectItem>
                        <SelectItem value="5+">5+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveProfile} className="flex-1">Save Changes</Button>
                    <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{userData.phone}</span></div>
                  <div className="flex items-center gap-2"><Building className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{userData.businessType}</span></div>
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{userData.yearsInBusiness} years in business</span></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Money */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile Money Integration
                <Button variant="outline" size="sm" onClick={() => setIsEditingMobileMoney(!isEditingMobileMoney)} className="ml-auto">
                  <Edit3 className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingMobileMoney ? (
                <>
                  <div>
                    <Label htmlFor="mpesa">M-Pesa Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input id="mpesa" placeholder="+254712345678" value={editedMobileMoneyData.mpesaNumber}
                        onChange={e => setEditedMobileMoneyData({ ...editedMobileMoneyData, mpesaNumber: e.target.value })} className="pl-10" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveMobileMoney} className="flex-1">Save Changes</Button>
                    <Button variant="outline" onClick={handleCancelMobileMoneyEdit}>Cancel</Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-medium text-sm">MP</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">M-Pesa</p>
                        <p className="text-xs text-muted-foreground">{mobileMoneyData.mpesaNumber || 'Not connected'}</p>
                      </div>
                    </div>
                    {mobileMoneyData.mpesaNumber ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Plus className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Benefits of connecting:</p>
                        <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
                          <li>• Automatic payment tracking</li>
                          <li>• Faster transaction processing</li>
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

        {/* ── LOANS TAB ── */}
        <TabsContent value="credit" className="space-y-4">

          {/* AI Coach CTA */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-purple-900">Want to know how much you can borrow?</p>
                  <p className="text-xs text-purple-700 mt-1">
                    Our AI Coach analyses your actual sales data and tells you exactly how much loan you could realistically afford to repay — before you apply.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                    onClick={onOpenAICoach}
                  >
                    <Bot className="w-3 h-3 mr-1" />
                    Ask AI Coach about loans
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              Loan products below are from real Kenyan banks and SACCOs. Filtered for your business type ({userData.businessType}). Always verify current rates directly with the institution before applying.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'bank', 'sacco', 'government'] as const).map(f => (
              <button key={f} onClick={() => setLoanFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  loanFilter === f
                    ? 'bg-[#00C4B4] text-white border-[#00C4B4]'
                    : 'bg-white text-muted-foreground border-gray-200 hover:border-gray-300'
                }`}>
                {f === 'all' ? 'All' : f === 'bank' ? '🏦 Banks' : f === 'sacco' ? '🤝 SACCOs' : '🏛️ Government'}
              </button>
            ))}
          </div>

          {/* Loan cards */}
          <div className="space-y-3">
            {filteredLoans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No loan products found for this filter. Try "All".
              </div>
            ) : filteredLoans.map(loan => (
              <Card key={loan.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                      {loan.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-semibold text-sm">{loan.institution}</p>
                          <p className="text-xs text-muted-foreground">{loan.product}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${loan.tagColor}`}>
                          {loan.tag}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 my-3">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Max Loan</p>
                          <p className="text-xs font-semibold">{formatCurrency(loan.maxAmount)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Interest</p>
                          <p className="text-xs font-semibold">{loan.interestRate}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Term</p>
                          <p className="text-xs font-semibold">{loan.term.replace('Up to ', '')}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Requirements:</p>
                        <div className="flex flex-wrap gap-1">
                          {loan.requirements.map((req, i) => (
                            <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{req}</span>
                          ))}
                        </div>
                      </div>

                      <a href={loan.applyUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="w-full text-xs border-[#00C4B4] text-[#00C4B4] hover:bg-[#00C4B4] hover:text-white">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Visit {loan.institution}
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom tip */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Landmark className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Tip before you apply</p>
                  <p className="text-xs text-green-700 mt-1">
                    Banks and SACCOs will look at your business history, M-Pesa statements, and ability to repay. Use the AI Coach (purple button) to simulate your repayment capacity based on your real sales data first.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ACHIEVEMENTS TAB ── */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Star className="w-4 h-4" />Business Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {achievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  return (
                    <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${achievement.earned ? 'bg-green-50 border border-green-200' : 'bg-muted/30 border border-muted'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${achievement.earned ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                      {achievement.earned && <Badge variant="secondary" className="bg-green-100 text-green-700">Earned</Badge>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader><CardTitle className="text-blue-700">Next Achievement</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Growth Champion</h4>
                  <p className="text-xs text-muted-foreground">Achieve 20% month-over-month growth</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1"><span>Progress</span><span>15%</span></div>
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