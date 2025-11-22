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
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchWallets, withdrawWallet, IWallet } from '@/services/wallet.service';
import { SUPPORTED_CURRENCIES } from '@/constants/currencies';
import { AxiosError } from 'axios';

export default function WithdrawScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();

    const [amount, setAmount] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
    const [bankAccount, setBankAccount] = useState('');

    const currencyFlagMap = useMemo(() => {
        return new Map(SUPPORTED_CURRENCIES.map(c => [c.code, c.flag]));
    }, []);

    const { data: wallets, isLoading: isLoadingWallets } = useQuery({
        queryKey: ['wallets'],
        queryFn: fetchWallets,
    });

    const mutation = useMutation({
        mutationFn: withdrawWallet,
        onSuccess: (data) => {
            Alert.alert(
                t('withdraw.successTitle'),
                t('withdraw.successMessage', { amount: data.amount, currency: data.currency })
            );
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
            router.back();
        },
        onError: (error: AxiosError | any) => {
            Alert.alert(t('withdraw.errorTitle'), error.message || t('common.error'));
        },
    });

    const getSelectedWallet = (): IWallet | undefined => {
        return wallets?.find(w => w.currency === selectedCurrency);
    }

    const validateAndSubmit = () => {
        const selectedWallet = getSelectedWallet();

        if (!selectedCurrency || !selectedWallet) {
            Alert.alert(t('common.validationError'), t('withdraw.validation.selectCurrency'));
            return;
        }

        const numericAmount = parseFloat(amount.replace(',', '.'));
        if (isNaN(numericAmount) || numericAmount <= 0) {
            Alert.alert(t('common.validationError'), t('withdraw.validation.invalidAmount'));
            return;
        }

        const availableBalance = parseFloat(selectedWallet.balance);
        if (numericAmount > availableBalance) {
            Alert.alert(t('common.validationError'), t('withdraw.validation.insufficientFunds'));
            return;
        }

        if (!/^[A-Z]{2}\d{13,}/.test(bankAccount.replace(/\s/g, ''))) {
            Alert.alert(t('common.validationError'), t('withdraw.validation.invalidIban'));
            return;
        }

        mutation.mutate({
            currency: selectedCurrency,
            amount: numericAmount,
        });
    };

    const renderWalletChips = () => {
        if (isLoadingWallets) {
            return <ActivityIndicator color="#5844ED" style={{ marginVertical: 10 }} />;
        }
        if (!wallets || wallets.length === 0) {
            return <Text style={styles.infoText}>{t('withdraw.noWallets')}</Text>
        }

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipContainer}
                contentContainerStyle={{ paddingHorizontal: 30 }}
            >
                {wallets.map((wallet) => {
                    const flag = currencyFlagMap.get(wallet.currency) || '🏳️';
                    const isSelected = selectedCurrency === wallet.currency;

                    return (
                        <Pressable
                            key={wallet.currency}
                            style={[
                                styles.chip,
                                isSelected ? styles.chipActive : styles.chipInactive
                            ]}
                            onPress={() => setSelectedCurrency(wallet.currency)}
                        >
                            <Text style={styles.chipFlag}>{flag}</Text>
                            <Text
                                style={[
                                    styles.chipText,
                                    isSelected ? styles.chipTextActive : styles.chipTextInactive
                                ]}
                            >
                                {wallet.currency}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        );
    };
  
    const selectedWallet = getSelectedWallet();

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <Text variant="headlineLarge" style={styles.title}>
                        {t('withdraw.title')}
                    </Text>
                    <IconButton
                        icon="close"
                        size={24}
                        onPress={() => router.back()}
                        style={styles.closeButton}
                    />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={[styles.label, styles.labelWithPadding]}>{t('withdraw.selectWallet')}</Text>
                    {renderWalletChips()}

                    <View style={styles.formContent}>
                        {selectedWallet && (
                            <Text style={styles.infoText}>
                                {t('withdraw.available')}:{' '}
                                <Text style={styles.infoTextBold}>
                                    {parseFloat(selectedWallet.balance).toLocaleString('pl-PL', {
                                        style: 'currency',
                                        currency: selectedWallet.currency,
                                    })}
                                </Text>
                            </Text>
                        )}

                        <Text style={styles.label}>{t('withdraw.amount')}</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            placeholderTextColor="#99A2AD"
                            keyboardType="numeric"
                            selectionColor="#5844ED"
                            editable={!!selectedCurrency}
                        />

                        <Text style={styles.label}>{t('withdraw.iban')}</Text>
                        <TextInput
                            style={styles.input}
                            value={bankAccount}
                            onChangeText={setBankAccount}
                            placeholder="PL00 0000 0000 0000 0000 0000"
                            placeholderTextColor="#99A2AD"
                            autoCapitalize="characters"
                            selectionColor="#5844ED"
                            editable={!!selectedCurrency}
                        />

                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                { opacity: pressed || mutation.isPending || !selectedCurrency ? 0.7 : 1 }
                            ]}
                            onPress={validateAndSubmit}
                            disabled={mutation.isPending || !selectedCurrency}
                        >
                            {mutation.isPending ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>{t('withdraw.button')}</Text>
                            )}
                        </Pressable>
                    </View>
                </ScrollView>
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
        paddingTop: 20,
        paddingBottom: 40,
    },
    formContent: {
        paddingHorizontal: 30,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333333',
        marginBottom: 8,
        marginTop: 15,
    },
    labelWithPadding: {
        paddingHorizontal: 30,
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
    chipContainer: {
        flexDirection: 'row',
        paddingVertical: 10,
        flexGrow: 0,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginRight: 10,
        borderWidth: 1.5,
    },
    chipActive: {
        backgroundColor: '#5844ED',
        borderColor: '#5844ED',
    },
    chipInactive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E0E0E0',
    },
    chipFlag: {
        fontSize: 22,
        marginRight: 8,
    },
    chipText: {
        fontSize: 16,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    chipTextInactive: {
        color: '#5844ED',
    },
    infoText: {
        marginTop: 10,
        fontSize: 15,
        color: '#99A2AD',
    },
    infoTextBold: {
        fontWeight: 'bold',
        color: '#333333',
    }
});
