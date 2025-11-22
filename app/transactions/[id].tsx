import {
    StyleSheet,
    View,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactionDetails, ITransaction, TransactionType } from '@/services/transaction.service';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { MaterialIcons } from '@expo/vector-icons';

const TRANSACTION_DETAILS_QUERY_KEY = 'transactionDetails';

interface DetailRowProps {
    label: string;
    value: string | number | null | undefined;
}

const DetailRow = ({ label, value }: DetailRowProps) => (
    <View style={detailStyles.row}>
        <Text style={detailStyles.label}>{label}</Text>
        <Text style={detailStyles.value}>{value || '-'}</Text>
    </View>
);

const detailStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    label: {
        fontSize: 15,
        color: '#666666',
        fontWeight: '500',
    },
    value: {
        fontSize: 15,
        color: '#333333',
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
});

const getTransactionColor = (type: TransactionType) => {
    switch (type) {
        case 'topup':
            return '#2ECC71';
        case 'exchange':
            return '#5844ED';
        case 'withdraw':
            return '#E74C3C';
        default:
            return '#333333';
    }
};

export default function TransactionDetailsScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: transaction, isLoading, error } = useQuery<ITransaction>({
        queryKey: [TRANSACTION_DETAILS_QUERY_KEY, id],
        queryFn: () => fetchTransactionDetails(id!),
        enabled: !!id,
    });

    const color = transaction ? getTransactionColor(transaction.type) : '#333333';

    Stack.Screen({
        options: {
            headerShown: true,
            headerTransparent: true,
            headerTitle: '',
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#333333" />
                </TouchableOpacity>
            ),
        },
    });

    if (isLoading || !id) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#5844ED" />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
        );
    }

    if (error || !transaction) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <Text style={styles.errorText}>{t('transactions.detailsError')}</Text>
                <Text style={styles.errorDetails}>{error?.message || t('common.notFound')}</Text>
            </View>
        );
    }

    const {
        type,
        timestamp,
        fromAmount,
        fromCurrency,
        toAmount,
        toCurrency,
        rateUsed
    } = transaction;

    const formattedDate = format(new Date(timestamp), 'd MMMM yyyy, HH:mm:ss', { locale: pl });

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.headerContent, { paddingTop: insets.top + 50 }]}>
                <View style={[styles.iconCircle, { backgroundColor: color + '1A' }]}>
                    <Text style={[styles.iconText, { color }]}>
                        {type.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.typeLabel}>{t(`transactions.type.${type}`)}</Text>

                <Text style={[styles.mainAmount, { color: color }]}>
                    {type === 'topup' && `+${toAmount} ${toCurrency}`}
                    {type === 'withdraw' && `-${fromAmount} ${fromCurrency}`}
                    {type === 'exchange' && `${fromAmount} ${fromCurrency}`}
                </Text>

                {type === 'exchange' && (
                    <Text style={styles.secondaryAmount}>
                        {t('transactions.received')}: {toAmount} {toCurrency}
                    </Text>
                )}
            </View>

            <View style={styles.detailsCard}>
                <DetailRow label={t('transactions.date')} value={formattedDate} />
                <DetailRow label={t('transactions.id')} value={id} />

                {type === 'exchange' && (
                    <>
                        <DetailRow label={t('transactions.sentAmount')} value={`${fromAmount} ${fromCurrency}`} />
                        <DetailRow label={t('transactions.receivedAmount')} value={`${toAmount} ${toCurrency}`} />
                        <DetailRow label={t('transactions.rateUsed')} value={rateUsed} />
                    </>
                )}
                {type === 'topup' && (
                    <DetailRow label={t('transactions.creditedTo')} value={toCurrency} />
                )}
                {type === 'withdraw' && (
                    <DetailRow label={t('transactions.debitedFrom')} value={fromCurrency} />
                )}
            </View>

            <View style={styles.helpSection}>
                <Text style={styles.helpText}>{t('transactions.needHelp')}</Text>
                <Text style={styles.helpLink}>{t('transactions.contactSupport')}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    headerContent: {
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingBottom: 30,
        backgroundColor: '#FFFFFF',
        marginBottom: 15,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        zIndex: 0,
    },
    backButton: {
        padding: 5,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconText: {
        fontSize: 30,
        fontWeight: 'bold',
    },
    typeLabel: {
        fontSize: 18,
        color: '#666666',
        marginBottom: 10,
    },
    mainAmount: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 5,
    },
    secondaryAmount: {
        fontSize: 16,
        color: '#99A2AD',
        fontWeight: '600',
        marginTop: 5,
    },
    detailsCard: {
        marginHorizontal: 25,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingHorizontal: 20,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    helpSection: {
        marginHorizontal: 25,
        marginTop: 30,
        alignItems: 'center',
    },
    helpText: {
        fontSize: 14,
        color: '#99A2AD',
        marginBottom: 5,
    },
    helpLink: {
        fontSize: 16,
        color: '#5844ED',
        fontWeight: '600',
    },
    loadingText: {
        color: '#5844ED',
        marginTop: 10,
    },
    errorText: {
        fontSize: 18,
        color: '#E74C3C',
        marginBottom: 5,
    },
    errorDetails: {
        color: '#333333',
        textAlign: 'center',
    },
});