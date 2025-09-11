import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  employee_id: string;
  name: string;
  surname: string;
  email: string;
  position: string;
  is_admin: boolean;
}

const POSITIONS = [
  'servis personeli',
  'barista',
  'supervizer',
  'müdür yardımcısı',
  'mağaza müdürü',
  'trainer'
];

export default function Index() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [showPositionPicker, setShowPositionPicker] = useState(false);

  useEffect(() => {
    checkAuthToken();
  }, []);

  const checkAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          await AsyncStorage.removeItem('auth_token');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const handleAuth = async () => {
    if (loading) return;

    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'E-posta ve şifre alanları zorunludur');
      return;
    }

    if (!isLogin) {
      if (!name.trim() || !surname.trim() || !selectedPosition) {
        Alert.alert('Hata', 'Tüm alanları doldurunuz');
        return;
      }
    }

    setLoading(true);
    
    try {
      const endpoint = isLogin ? 'login' : 'register';
      const body = isLogin 
        ? { email: email.toLowerCase().trim(), password }
        : {
            email: email.toLowerCase().trim(),
            password,
            name: name.trim(),
            surname: surname.trim(),
            position: selectedPosition
          };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('auth_token', data.access_token);
        setUser(data.user);
        
        Alert.alert(
          'Başarılı!', 
          isLogin 
            ? `Hoş geldiniz, ${data.user.name} ${data.user.surname}!` 
            : `Kayıt başarılı! Sicil numaranız: ${data.user.employee_id}`
        );
        
        // Clear form
        setEmail('');
        setPassword('');
        setName('');
        setSurname('');
        setSelectedPosition('');
      } else {
        Alert.alert('Hata', data.detail || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Hata', 'Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const PositionPicker = () => (
    <View style={styles.positionPicker}>
      <Text style={styles.positionPickerTitle}>Pozisyon Seçin:</Text>
      {POSITIONS.map((position) => (
        <TouchableOpacity
          key={position}
          style={[
            styles.positionOption,
            selectedPosition === position && styles.selectedPosition
          ]}
          onPress={() => {
            setSelectedPosition(position);
            setShowPositionPicker(false);
          }}
        >
          <Text style={[
            styles.positionOptionText,
            selectedPosition === position && styles.selectedPositionText
          ]}>
            {position.charAt(0).toUpperCase() + position.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Dashboard component
  const Dashboard = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B4513" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mikel Coffee</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Çıkış</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            Hoş Geldiniz, {user?.name} {user?.surname}!
          </Text>
          <View style={styles.userInfo}>
            <Text style={styles.userInfoText}>Sicil No: {user?.employee_id}</Text>
            <Text style={styles.userInfoText}>
              Pozisyon: {user?.position?.charAt(0).toUpperCase() + user?.position?.slice(1)}
            </Text>
            <Text style={styles.userInfoText}>E-posta: {user?.email}</Text>
            {user?.is_admin && (
              <Text style={styles.adminBadge}>YÖNETİCİ</Text>
            )}
          </View>
        </View>

        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemTitle}>Duyurular</Text>
            <Text style={styles.menuItemSubtitle}>Şirket haberlerini görün</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemTitle}>Sınav Sonuçları</Text>
            <Text style={styles.menuItemSubtitle}>Performans sonuçlarınız</Text>
          </TouchableOpacity>
          
          {(user?.position === 'barista' || user?.position === 'supervizer') && (
            <TouchableOpacity style={[styles.menuItem, styles.specialMenuItem]}>
              <Text style={styles.menuItemTitle}>Yöneticilik Sınavı</Text>
              <Text style={styles.menuItemSubtitle}>Karriyere ilerle</Text>
            </TouchableOpacity>
          )}
          
          {user?.position === 'trainer' && (
            <>
              <TouchableOpacity style={[styles.menuItem, styles.trainerMenuItem]}>
                <Text style={styles.menuItemTitle}>Sınav Sonucu Gir</Text>
                <Text style={styles.menuItemSubtitle}>Çalışan değerlendirmesi</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.menuItem, styles.trainerMenuItem]}>
                <Text style={styles.menuItemTitle}>Duyuru Paylaş</Text>
                <Text style={styles.menuItemSubtitle}>Yeni duyuru oluştur</Text>
              </TouchableOpacity>
            </>
          )}
          
          {user?.is_admin && (
            <TouchableOpacity style={[styles.menuItem, styles.adminMenuItem]}>
              <Text style={styles.menuItemTitle}>Yönetici Paneli</Text>
              <Text style={styles.menuItemSubtitle}>Sistem yönetimi</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (user) {
    return <Dashboard />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B4513" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mikel Coffee</Text>
          <Text style={styles.headerSubtitle}>Çalışan Sistemi</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.authContainer}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.activeTab]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                  Giriş Yap
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.activeTab]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                  Kayıt Ol
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {!isLogin && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Adınız"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Soyadınız"
                    placeholderTextColor="#999"
                    value={surname}
                    onChangeText={setSurname}
                    autoCapitalize="words"
                  />
                  
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowPositionPicker(true)}
                  >
                    <Text style={[
                      styles.inputText,
                      !selectedPosition && styles.placeholder
                    ]}>
                      {selectedPosition 
                        ? selectedPosition.charAt(0).toUpperCase() + selectedPosition.slice(1)
                        : 'Pozisyonunuzu seçin'
                      }
                    </Text>
                  </TouchableOpacity>
                  
                  {showPositionPicker && <PositionPicker />}
                </>
              )}

              <TextInput
                style={styles.input}
                placeholder="E-posta adresiniz"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Şifreniz"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleAuth}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3',
  },
  header: {
    backgroundColor: '#8B4513',
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#F5E6D3',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  authContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#8B4513',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  positionPicker: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  positionPickerTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#333',
  },
  positionOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedPosition: {
    backgroundColor: '#8B4513',
  },
  positionOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedPositionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#8B4513',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Dashboard styles
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 12,
  },
  userInfo: {
    gap: 6,
  },
  userInfoText: {
    fontSize: 16,
    color: '#666',
  },
  adminBadge: {
    backgroundColor: '#FF6B6B',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  menuGrid: {
    gap: 12,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  specialMenuItem: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  trainerMenuItem: {
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  adminMenuItem: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});