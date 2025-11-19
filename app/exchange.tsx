import { CurrencyPickerModal } from '@/components/CurrencyPickerModal';
import { AppCurrency, SUPPORTED_CURRENCIES } from '@/constants/currencies';
import { performExchange } from '@/services/exchange.service';
import { getCurrencyRates } from '@/services/nbp.service';
import { fetchWallets, IWallet } from '@/services/wallet.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const useDebounce = (value: string, delay: number): string => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

export default function ExchangeScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();

    const [fromAmount, setFromAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('PLN');
    const [toCurrency, setToCurrency] = useState('USD');

    const [isFromPickerVisible, setFromPickerVisible] = useState(false);
    const [isToPickerVisible, setToPickerVisible] = useState(false);

    const debouncedFromAmount = useDebounce(fromAmount, 500);
    const numericFromAmount = useMemo(() => {
        return parseFloat(debouncedFromAmount.replace(',', '.')) || 0;
    }, [debouncedFromAmount]);

    const { data: userWallets } = useQuery<IWallet[]>({
        queryKey: ['wallets'],
        queryFn: fetchWallets,
    });

    const { data: quote, isLoading: isQuoteLoading, error: quoteError } = useQuery({
        queryKey: ['exchangeQuote', fromCurrency, toCurrency, numericFromAmount],
        queryFn: async () => {
            if (numericFromAmount <= 0) return null;
            if (fromCurrency === toCurrency) return null;

            let toAmount: number;
            let rateUsed: number;

            try {
                if (fromCurrency === 'PLN') {
                    const rates = await getCurrencyRates(toCurrency);
                    rateUsed = rates.ask;
                    toAmount = numericFromAmount / rateUsed;
                } else if (toCurrency === 'PLN') {
                    const rates = await getCurrencyRates(fromCurrency);
                    rateUsed = rates.bid;
                    toAmount = numericFromAmount * rateUsed;
                } else {
                    const [ratesFrom, ratesTo] = await Promise.all([
                        getCurrencyRates(fromCurrency),
                        getCurrencyRates(toCurrency)
                    ]);
                    const intermediatePlnAmount = numericFromAmount * ratesFrom.bid;
                    toAmount = intermediatePlnAmount / ratesTo.ask;
                    rateUsed = ratesFrom.bid / ratesTo.ask;
                }

                return {
                    toAmount: toAmount.toFixed(2),
                    rateUsed: rateUsed.toString(),
                };
            } catch (error: any) {
                throw new Error(error.message || 'Nie można obliczyć kursu');
            }
        },
        enabled: numericFromAmount > 0 && !!fromCurrency && !!toCurrency && fromCurrency !== toCurrency,
        staleTime: 30000,
    });

    const mutation = useMutation({
        mutationFn: performExchange,
        onSuccess: (data) => {
            Alert.alert(
                t('exchange.successTitle'),
                t('exchange.successMessage', {
                    fromAmount: data.fromAmount,
                    fromCurrency: data.fromCurrency,
                    toAmount: data.toAmount,
                    toCurrency: data.toCurrency,
                })
            );
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
            router.back();
        },
        onError: (error: AxiosError | any) => {
            Alert.alert(t('exchange.errorTitle'), error.message || t('common.error'));
        },
    });

    const fromWallet = useMemo(() => {
        return userWallets?.find(w => w.currency === fromCurrency);
    }, [userWallets, fromCurrency]);

    const fromBalance = useMemo(() => parseFloat(fromWallet?.balance || '0'), [fromWallet]);
    const hasSufficientFunds = useMemo(() => {
        const amount = parseFloat(fromAmount.replace(',', '.')) || 0;
        return amount <= fromBalance;
    }, [fromAmount, fromBalance]);

    const toAmountDisplay = useMemo(() => {
        if (isQuoteLoading) return t('exchange.calculating');
        if (numericFromAmount <= 0) return '0.00';
        return quote?.toAmount || '0.00';
    }, [quote, isQuoteLoading, numericFromAmount, t]);

    const displayRate = useMemo(() => {
        if (!quote?.rateUsed || numericFromAmount <= 0) return null;
        const rate = parseFloat(quote.rateUsed);
        if (isNaN(rate)) return null;
        return `1 ${fromCurrency} ≈ ${rate.toFixed(4)} ${toCurrency}`;
    }, [quote, fromCurrency, toCurrency, numericFromAmount]);

    const selectedFromCurrency = useMemo(() => {
        return SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency) || SUPPORTED_CURRENCIES[0];
    }, [fromCurrency]);

    const selectedToCurrency = useMemo(() => {
        return SUPPORTED_CURRENCIES.find(c => c.code === toCurrency) || SUPPORTED_CURRENCIES[0];
    }, [toCurrency]);

    const handleFromCurrencySelect = (selected: AppCurrency) => {
        if (selected.code === toCurrency) {
            handleSwap();
        } else {
            setFromCurrency(selected.code);
        }
    };

    const handleToCurrencySelect = (selected: AppCurrency) => {
        if (selected.code === fromCurrency) {
            handleSwap();
        } else {
            setToCurrency(selected.code);
        }
    };

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
        if (toAmountDisplay !== '0.00' && toAmountDisplay !== t('exchange.calculating')) {
            setFromAmount(toAmountDisplay);
        }
    };

    const validateAndSubmit = () => {
        const numericAmount = parseFloat(fromAmount.replace(',', '.'));

        if (isNaN(numericAmount) || numericAmount <= 0) {
            Alert.alert(t('common.validationError'), t('exchange.validation.invalidAmount'));
            return;
        }
        if (fromCurrency === toCurrency) {
            Alert.alert(t('common.validationError'), t('exchange.validation.sameCurrency'));
            return;
        }
        if (!hasSufficientFunds) {
            Alert.alert(t('common.validationError'), t('exchange.validation.insufficientFunds'));
            return;
        }
        if (quoteError) {
            Alert.alert(t('common.validationError'), t('exchange.validation.rateError', { message: quoteError.message }));
            return;
        }

        mutation.mutate({
            fromCurrency,
            toCurrency,
            amount: numericAmount,
        });
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <Text variant="headlineLarge" style={styles.title}>
                        {t('exchange.title')}
                    </Text>
                    <IconButton
                        icon="close"
                        size={24}
                        onPress={() => router.back()}
                        style={styles.closeButton}
                    />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.label}>{t('exchange.from')}</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, styles.inputAmount]}
                            value={fromAmount}
                            onChangeText={setFromAmount}
                            placeholder="0.00"
                            placeholderTextColor="#99A2AD"
                            keyboardType="numeric"
                            selectionColor="#5844ED"
                        />
                        <Pressable
                            style={({ pressed }) => [
                                styles.currencyPickerButton,
                                { opacity: pressed ? 0.7 : 1 }
                            ]}
                            onPress={() => setFromPickerVisible(true)}
                        >
                            <Text style={styles.currencyPickerFlag}>{selectedFromCurrency.flag}</Text>
                            <Text style={styles.currencyPickerText}>{selectedFromCurrency.code}</Text>
                            <Text style={styles.currencyPickerArrow}>▼</Text>
                        </Pressable>
                    </View>
                    <Text style={styles.balanceText}>
                        {t('exchange.balance')}: {fromBalance.toFixed(2)} {fromCurrency}
                    </Text>
                    {!hasSufficientFunds && fromAmount.length > 0 && (
                        <Text style={styles.errorText}>
                            {t('exchange.validation.insufficientFunds')}
                        </Text>
                    )}

                    <View style={styles.swapContainer}>
                        <IconButton
                            icon="swap-vertical"
                            size={30}
                            iconColor="#5844ED"
                            style={styles.swapButton}
                            onPress={handleSwap}
                        />
                    </View>

                    <Text style={styles.label}>{t('exchange.to')}</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, styles.inputAmount, styles.inputDisabled]}
                            value={toAmountDisplay}
                            editable={false}
                        />
                        <Pressable
                            style={({ pressed }) => [
                                styles.currencyPickerButton,
                                { opacity: pressed ? 0.7 : 1 }
                            ]}
                            onPress={() => setToPickerVisible(true)}
                        >
                            <Text style={styles.currencyPickerFlag}>{selectedToCurrency.flag}</Text>
                            <Text style={styles.currencyPickerText}>{selectedToCurrency.code}</Text>
                            <Text style={styles.currencyPickerArrow}>▼</Text>
                        </Pressable>
                    </View>

                    <View style={styles.rateContainer}>
                        {isQuoteLoading && (
                            <ActivityIndicator size="small" color="#5844ED" />
                        )}
                        {!isQuoteLoading && displayRate && (
                            <Text style={styles.rateText}>{displayRate}</Text>
                        )}
                        {!isQuoteLoading && quoteError && (
                            <Text style={styles.errorText}>
                                {t('exchange.validation.rateError', { message: quoteError.message })}
                            </Text>
                        )}
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            { opacity: pressed || mutation.isPending || isQuoteLoading ? 0.7 : 1 }
                        ]}
                        onPress={validateAndSubmit}
                        disabled={mutation.isPending || isQuoteLoading || !hasSufficientFunds || numericFromAmount <= 0 || !!quoteError}
                    >
                        {mutation.isPending ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>{t('exchange.button')}</Text>
                        )}
                    </Pressable>
                </ScrollView>

                <CurrencyPickerModal
                    isVisible={isFromPickerVisible}
                    onClose={() => setFromPickerVisible(false)}
                    onSelect={handleFromCurrencySelect}
                    currentCode={fromCurrency}
                />
                <CurrencyPickerModal
                    isVisible={isToPickerVisible}
                    onClose={() => setToPickerVisible(false)}
                    onSelect={handleToCurrencySelect}
                    currentCode={toCurrency}
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
    inputRow: {
        flexDirection: 'row',
        height: 50,
    },
    input: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    inputAmount: {
        flex: 1,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
    },
    inputDisabled: {
        backgroundColor: '#F0F0F0',
        color: '#777',
    },
    currencyPickerButton: {
        width: 120,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderColor: '#E0E0E0',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        paddingHorizontal: 10,
    },
    currencyPickerFlag: {
        fontSize: 22,
    },
    currencyPickerText: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '600',
    },
    currencyPickerArrow: {
        fontSize: 12,
        color: '#5844ED',
    },
    balanceText: {
        fontSize: 13,
        color: '#667080',
        marginTop: 6,
        textAlign: 'right',
    },
    errorText: {
        fontSize: 13,
        color: '#D93F3F',
        marginTop: 6,
        textAlign: 'left',
    },
    swapContainer: {
        alignItems: 'center',
        marginVertical: -10,
        zIndex: 1,
    },
    swapButton: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 50,
    },
    rateContainer: {
        marginTop: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rateText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5844ED',
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
});