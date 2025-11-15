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
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { registerUser } from '../../services/auth.service';
import { AxiosError } from 'axios';

export default function RegisterScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const mutation = useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            Alert.alert(
                t('register.successTitle'),
                t('register.successMessage'),
                [{ text: 'OK', onPress: () => router.replace('/login') }]
            );
        },
        onError: (error: AxiosError | any) => {
            if (error.response?.status === 409) {
                Alert.alert(t('register.errorTitle'), t('register.errorEmailExists'));
            } else {
                Alert.alert(t('register.errorTitle'));
            }
        },
    });

    const handleRegister = () => {
        if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert(t('register.validationTitle'), t('register.validationMessage'));
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(t('register.errorTitle'), t('register.errorPasswordMismatch'));
            return;
        }
        mutation.mutate({ email, password });
    };

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
            <View style={styles.container}>
                <Text style={styles.logoText}>
                    <Text style={styles.logoPrimary}>kantor</Text>
                    <Text style={styles.logoSecondary}>.com</Text>
                </Text>

                <Text variant="headlineLarge" style={styles.title}>
                    {t('register.title')}
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
                    placeholder={t('register.password')}
                    placeholderTextColor="#99A2AD"
                    secureTextEntry
                    selectionColor="#5844ED"
                />

                <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t('register.confirmPassword')}
                    placeholderTextColor="#99A2AD"
                    secureTextEntry
                    selectionColor="#5844ED"
                />

                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        { opacity: pressed || mutation.isPending ? 0.7 : 1 }
                    ]}
                    onPress={handleRegister}
                    disabled={mutation.isPending}
                >
                    {mutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>{t('register.button')}</Text>
                    )}
                </Pressable>

                <Link href="/login" asChild>
                    <Pressable style={styles.linkContainer}>
                        <Text style={styles.linkText}>{t('register.loginLink')}</Text>
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
        marginBottom: 35,
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
        marginBottom: 25,
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
        marginTop: 25,
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
