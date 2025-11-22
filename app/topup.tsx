import {
    StyleSheet,
    View,
    TextInput,
    Pressable,
    ActivityIndicator,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
    ScrollView,
    Platform,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { topUpWallet } from '@/services/wallet.service';
import { SUPPORTED_CURRENCIES, AppCurrency } from '@/constants/currencies';
import { CurrencyPickerModal } from '@/components/CurrencyPickerModal'; 
import { AxiosError } from 'axios';

const getCardType = (number: string): 'VISA' | 'MASTERCARD' | 'UNKNOWN' => {
    if (/^4/.test(number)) return 'VISA';
    if (/^5[1-5]/.test(number)) return 'MASTERCARD';
    return 'UNKNOWN';
};

export default function TopUpScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();

    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('PLN');
    const [cardNumber, setCardNumber] = useState('');
    const [rawCardNumber, setRawCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    const [isPickerVisible, setPickerVisible] = useState(false);

    const cardType = useMemo(() => getCardType(rawCardNumber), [rawCardNumber]);

    const selectedCurrency = useMemo(() => {
        return SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];
    }, [currency]);

    const mutation = useMutation({
        mutationFn: topUpWallet,
        onSuccess: (data) => {
            Alert.alert(
                t('topup.successTitle'),
                t('topup.successMessage', { amount: data.amount, currency: data.currency })
            );
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
            router.back();
        },
        onError: (error: AxiosError | any) => {
            Alert.alert(t('topup.errorTitle'), error.message || t('common.error'));
        },
    });

    const handleCardNumberChange = (text: string) => {
        const normalized = text.replace(/[^0-9]/g, '');
        setRawCardNumber(normalized);
        const formatted = normalized.match(/.{1,4}/g)?.join(' ') || '';
        setCardNumber(formatted);
    };

    const handleExpiryChange = (text: string) => {
        const normalized = text.replace(/[^0-9]/g, '');
        if (normalized.length <= 2 && expiry.length < text.length) {
            setExpiry(normalized);
        } else if (normalized.length > 2) {
            setExpiry(`${normalized.slice(0, 2)}/${normalized.slice(2, 4)}`);
        } else {
            setExpiry(normalized);
        }
    };

    const handleCurrencySelect = (selected: AppCurrency) => {
        setCurrency(selected.code);
    };

    const validateAndSubmit = () => {
        const numericAmount = parseFloat(amount.replace(',', '.'));
        if (isNaN(numericAmount) || numericAmount <= 0) {
            Alert.alert(t('common.validationError'), t('topup.validation.invalidAmount'));
            return;
        }

        if (cardType === 'UNKNOWN' || rawCardNumber.length < 16) {
            Alert.alert(t('common.validationError'), t('topup.validation.invalidCard'));
            return;
        }

        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
            Alert.alert(t('common.validationError'), t('topup.validation.invalidExpiryFormat'));
            return;
        }
        const [month, year] = expiry.split('/');
        const expiryDate = new Date(parseInt(`20${year}`), parseInt(month) - 1);
        const lastDayOfMonth = new Date(expiryDate.getFullYear(), expiryDate.getMonth() + 1, 0);
        if (lastDayOfMonth < new Date()) {
            Alert.alert(t('common.validationError'), t('topup.validation.cardExpired'));
            return;
        }

        if (cvv.trim().length !== 3) {
            Alert.alert(t('common.validationError'), t('topup.validation.invalidCvv'));
            return;
        }

        mutation.mutate({
            currency: currency.toUpperCase(),
            amount: numericAmount,
        });
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <Text variant="headlineLarge" style={styles.title}>
                        {t('topup.title')}
                    </Text>
                    <IconButton
                        icon="close"
                        size={24}
                        onPress={() => router.back()}
                        style={styles.closeButton}
                    />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.label}>{t('topup.amount')}</Text>
                    <TextInput
                        style={styles.input}
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0.00"
                        placeholderTextColor="#99A2AD"
                        keyboardType="numeric"
                        selectionColor="#5844ED"
                    />

                    <Text style={styles.label}>{t('topup.currency')}</Text>
                    <Pressable
                        style={({ pressed }) => [
                            styles.input,
                            styles.currencyPickerButton,
                            { opacity: pressed ? 0.7 : 1 }
                        ]}
                        onPress={() => setPickerVisible(true)}
                    >
                        <View style={styles.currencyPickerValue}>
                            <Text style={styles.currencyPickerFlag}>{selectedCurrency.flag}</Text>
                            <Text style={styles.currencyPickerText}>{selectedCurrency.code}</Text>
                        </View>
                        <Text style={styles.currencyPickerArrow}>▼</Text>
                    </Pressable>

                    <Text style={styles.label}>{t('topup.cardNumber')}</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[styles.input, styles.inputWithIcon]}
                            value={cardNumber}
                            onChangeText={handleCardNumberChange}
                            placeholder="0000 0000 0000 0000"
                            placeholderTextColor="#99A2AD"
                            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                            maxLength={19}
                            selectionColor="#5844ED"
                        />
                        {cardType !== 'UNKNOWN' && (
                            <Text style={styles.cardType}>{cardType}</Text>
                        )}
                    </View>

                    <View style={styles.inlineInputs}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>{t('topup.expiry')}</Text>
                            <TextInput
                                style={styles.input}
                                value={expiry}
                                onChangeText={handleExpiryChange}
                                placeholder="MM/RR"
                                placeholderTextColor="#99A2AD"
                                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                                maxLength={5}
                                selectionColor="#5844ED"
                            />
                        </View>
                        <View style={[styles.inputWrapper, styles.inputWrapperMargin]}>
                            <Text style={styles.label}>{t('topup.cvv')}</Text>
                            <TextInput
                                style={styles.input}
                                value={cvv}
                                onChangeText={setCvv}
                                placeholder="123"
                                placeholderTextColor="#99A2AD"
                                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                                maxLength={3}
                                secureTextEntry
                                selectionColor="#5844ED"
                            />
                        </View>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            { opacity: pressed || mutation.isPending ? 0.7 : 1 }
                        ]}
                        onPress={validateAndSubmit}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>{t('topup.button')}</Text>
                        )}
                    </Pressable>
                </ScrollView>

                <CurrencyPickerModal
                    isVisible={isPickerVisible}
                    onClose={() => setPickerVisible(false)}
                    onSelect={handleCurrencySelect}
                    currentCode={currency}
                />
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
        position: 'relative',
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333333',
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    scrollContent: {
        paddingHorizontal: 30,
        paddingTop: 20,
        paddingBottom: 40,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333333',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        height: 50,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
    },
    inputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    inputWithIcon: {
        paddingRight: 100,
    },
    cardType: {
        position: 'absolute',
        right: 15,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#5844ED',
    },
    inlineInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputWrapper: {
        flex: 1,
    },
    inputWrapperMargin: {
        marginLeft: 15,
    },
    button: {
        backgroundColor: '#5844ED',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 40,
        shadowColor: "#5844ED",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    currencyPickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    currencyPickerValue: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencyPickerFlag: {
        fontSize: 22,
        marginRight: 10,
    },
    currencyPickerText: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '600',
    },
    currencyPickerArrow: {
        fontSize: 16,
        color: '#5844ED',
    },
});
