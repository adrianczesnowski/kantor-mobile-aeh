import {
    StyleSheet,
    View,
    TextInput,
    Pressable,
    ActivityIndicator,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { loginUser } from '@/services/auth.service';

export default function LoginScreen() {
    const { t } = useTranslation();
    const { setToken } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const mutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            setToken(data.token);
        },
        onError: (error: AxiosError | any) => {
            console.error('Błąd logowania:', error.response?.data?.message || error.message);
            Alert.alert(t('login.errorTitle'));
        },
    });

    const handleLogin = () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert(t('login.validationTitle'), t('login.validationMessage'));
            return;
        }
        mutation.mutate({ email, password });
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
            <View style={styles.container}>
                <Text style={styles.logoText}>
                    <Text style={styles.logoPrimary}>kantor</Text>
                    <Text style={styles.logoSecondary}>.com</Text>
                </Text>

                <Text variant="headlineLarge" style={styles.title}>
                    {t('login.title')}
                </Text>

                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#99A2AD"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    selectionColor="#5844ED"
                />

                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('login.password')}
                    placeholderTextColor="#99A2AD"
                    secureTextEntry
                    selectionColor="#5844ED"
                />

                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        { opacity: pressed || mutation.isPending ? 0.7 : 1 }
                    ]}
                    onPress={handleLogin}
                    disabled={mutation.isPending}
                >
                    {mutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>{t('login.button')}</Text>
                    )}
                </Pressable>

                <Link href="/register" asChild>
                    <Pressable style={styles.linkContainer}>
                        <Text style={styles.linkText}>{t('login.registerLink')}</Text>
                    </Pressable>
                </Link>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        backgroundColor: '#F5F7FA',
    },
    logoText: {
        fontSize: 48,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 50,
    },
    logoPrimary: {
        textAlign: 'center',
        color: '#5844ED',
    },
    logoSecondary: {
        textAlign: 'center',
        color: '#333333',
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333333',
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        height: 50,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        color: '#333333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    button: {
        backgroundColor: '#5844ED',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
        shadowColor: "#5844ED",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkContainer: {
        marginTop: 25,
        alignItems: 'center',
    },
    linkText: {
        color: '#5844ED',
        fontSize: 15,
        fontWeight: '500',
    },
});
