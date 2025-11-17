import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Snackbar, IconButton, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { changeLanguage } from '@/services/user.service';

interface LanguageData {
    language: 'pl' | 'en';
    message: string;
}

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const { logout } = useAuthStore();

    const [modalVisible, setModalVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    const languageMutation = useMutation({
        mutationFn: changeLanguage,
        onSuccess: (data: LanguageData) => {
            const newLang = data.language;
            i18n.changeLanguage(newLang);
        },
        onError: () => {
            setSnackbarMessage(t('settings.languageError', 'Błąd zmiany języka'));
            setSnackbarVisible(true);
        }
    });

    const toggleLanguage = () => {
        const newLang = i18n.language === 'pl' ? 'en' : 'pl';
        languageMutation.mutate({ language: newLang });
    };

    const showPasswordSuccess = () => {
        setModalVisible(false);
        setSnackbarMessage(t('settings.passwordSuccess'));
        setSnackbarVisible(true);
    };

    const currentLanguageName = i18n.language === 'pl'
        ? t('settings.polish', 'Polski')
        : t('settings.english', 'English');

    return (
        <>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                style={{ backgroundColor: styles.container.backgroundColor }}
            >
                <View style={{ ...styles.container, paddingTop: insets.top }}>

                    <Text variant="headlineMedium" style={styles.title}>
                        {t('settings.title')}
                    </Text>

                    <Text style={styles.groupTitle}>{t('settings.groupGeneral', 'Ogólne')}</Text>
                    <View style={styles.settingsGroup}>
                        <Pressable
                            style={({ pressed }) => [styles.settingItem, styles.settingItemTop, { opacity: pressed ? 0.7 : 1 }]}
                            onPress={toggleLanguage}
                            disabled={languageMutation.isPending}
                        >
                            <View style={styles.settingItemLeft}>
                                <IconButton icon="translate" size={24} iconColor="#5844ED" style={styles.settingIcon} />
                                <Text style={styles.settingItemText}>{t('settings.languageTitle')}</Text>
                            </View>
                            <View style={styles.settingItemRight}>
                                {languageMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#5844ED" />
                                ) : (
                                    <Text style={styles.settingItemValue}>{currentLanguageName}</Text>
                                )}
                                <IconButton icon="chevron-right" size={24} iconColor="#99A2AD" style={styles.settingChevron} />
                            </View>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [styles.settingItem, { opacity: pressed ? 0.7 : 1 }]}
                            onPress={() => setModalVisible(true)}
                        >
                            <View style={styles.settingItemLeft}>
                                <IconButton icon="lock" size={24} iconColor="#5844ED" style={styles.settingIcon} />
                                <Text style={styles.settingItemText}>{t('settings.changePasswordTitle')}</Text>
                            </View>
                            <View style={styles.settingItemRight}>
                                <IconButton icon="chevron-right" size={24} iconColor="#99A2AD" style={styles.settingChevron} />
                            </View>
                        </Pressable>
                    </View>

                    <Text style={styles.groupTitle}>{t('settings.groupAccount', 'Konto')}</Text>
                    <View style={styles.settingsGroup}>
                        <Pressable
                            style={({ pressed }) => [styles.settingItem, { opacity: pressed ? 0.7 : 1 }]}
                            onPress={logout}
                        >
                            <View style={styles.settingItemLeft}>
                                <IconButton icon="logout" size={24} iconColor="#E74C3C" style={styles.settingIcon} />
                                <Text style={[styles.settingItemText, styles.logoutText]}>{t('settings.logout')}</Text>
                            </View>
                        </Pressable>
                    </View>

                </View>
            </ScrollView>

            <ChangePasswordModal
                visible={modalVisible}
                onDismiss={() => setModalVisible(false)}
                onSuccess={showPasswordSuccess}
            />

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={styles.snackbar}
            >
                {snackbarMessage}
            </Snackbar>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: '#F5F7FA',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        marginVertical: 10,
    },
    logoPrimary: {
        color: '#5844ED',
    },
    logoSecondary: {
        color: '#333333',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 30,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#99A2AD',
        textTransform: 'uppercase',
        marginLeft: 10,
        marginBottom: 8,
    },
    settingsGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingLeft: 10,
        paddingRight: 5,
        backgroundColor: '#FFFFFF',
    },
    settingItemTop: {
        borderBottomWidth: 1,
        borderBottomColor: '#F5F7FA',
    },
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingIcon: {
        margin: 0, 
        marginRight: 8,
    },
    settingItemText: {
        fontSize: 17,
        fontWeight: '500',
        color: '#333333',
    },
    settingItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingItemValue: {
        fontSize: 16,
        color: '#99A2AD',
        marginRight: 0,
    },
    settingChevron: {
        margin: 0,
        padding: 0,
    },
    logoutText: {
        color: '#E74C3C',
        fontWeight: '600',
    },
    snackbar: {
        backgroundColor: '#333333',
        margin: 10,
    }
});
