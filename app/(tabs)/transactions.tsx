import {
    StyleSheet,
    View,
    FlatList,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTransactions, ITransaction, TransactionType } from '@/services/transaction.service';
import { format, isToday, isYesterday } from 'date-fns';
import { pl } from 'date-fns/locale';

const TRANSACTIONS_PER_PAGE = 10;
const TRANSACTION_QUERY_KEY = 'transactionsHistory';


interface TransactionItemProps {
    transaction: ITransaction;
    t: (key: string) => string;
    onPress: (id: string) => void;
}

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

const groupTransactionsByDate = (transactions: ITransaction[], t: (key: string) => string) => {
    const flatListWithHeaders: Array<{ type: 'header' | 'transaction', title?: string, transaction?: ITransaction, key: string }> = [];
    let lastHeader: string | null = null;

    transactions.forEach(transaction => {
        const date = new Date(transaction.timestamp);

        let currentHeader;
        if (isToday(date)) {
            currentHeader = t('common.today');
        } else if (isYesterday(date)) {
            currentHeader = t('common.yesterday');
        } else {
            currentHeader = format(date, 'd MMMM yyyy', { locale: pl });
        }

        if (currentHeader !== lastHeader) {
            flatListWithHeaders.push({
                type: 'header',
                title: currentHeader,
                key: `header-${currentHeader}-${transaction._id}`
            });
            lastHeader = currentHeader;
        }

        flatListWithHeaders.push({
            type: 'transaction',
            transaction: transaction,
            key: transaction._id
        });
    });

    return flatListWithHeaders;
};

const TransactionItem = ({ transaction, t, onPress }: TransactionItemProps) => {
    const { type, fromAmount, toAmount, fromCurrency, toCurrency, timestamp } = transaction;
    const color = getTransactionColor(type);

    const renderMainInfo = () => {
        switch (type) {
            case 'exchange':
                return (
                    <Text style={styles.itemMainInfoExchange}>
                        {fromAmount} {fromCurrency} {'\u2192'} {toAmount} {toCurrency}
                    </Text>
                );
            case 'topup':
                return (
                    <Text style={[styles.itemMainInfo, { color }]}>
                        +{toAmount} {toCurrency}
                    </Text>
                );
            case 'withdraw':
                return (
                    <Text style={[styles.itemMainInfo, { color }]}>
                        -{fromAmount} {fromCurrency}
                    </Text>
                );
            default:
                return <Text style={styles.itemMainInfo}>{t('transactions.unknown')}</Text>;
        }
    };

    return (
        <Pressable
            onPress={() => onPress(transaction._id)}
            style={({ pressed }) => [
                styles.itemContainer,
                { opacity: pressed ? 0.9 : 1 }
            ]}
        >
            <View style={[styles.iconCircle, { backgroundColor: color + '1A' }]}>
                <Text style={[styles.iconText, { color }]}>
                    {type.charAt(0).toUpperCase()}
                </Text>
            </View>

            <View style={styles.itemDetails}>
                <Text style={styles.itemType}>{t(`transactions.type.${type}`)}</Text>
                <Text style={styles.itemDate}>
                    {format(new Date(timestamp), 'HH:mm', { locale: pl })}
                </Text>
            </View>

            <View style={styles.itemAmountContainer}>
                {renderMainInfo()}
            </View>
        </Pressable>
    );
};



export default function TransactionsScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: [TRANSACTION_QUERY_KEY],
        queryFn: ({ pageParam = 0 }) =>
            fetchTransactions(TRANSACTIONS_PER_PAGE, pageParam * TRANSACTIONS_PER_PAGE),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < TRANSACTIONS_PER_PAGE) {
                return undefined;
            }
            return allPages.length;
        },
    });

    const allTransactions = data?.pages?.flatMap(page => page) || [];

    const flatListData = groupTransactionsByDate(allTransactions, t);

    const handleTransactionPress = (id: string) => {
        router.push(`/transactions/${id}`);
        console.log(`Przejdź do szczegółów transakcji: ${id}`);
    };

    const renderItem = ({ item }: { item: any }) => {
        if (item.type === 'header') {
            return <Text style={styles.dateHeader}>{item.title}</Text>;
        }
        return (
            <TransactionItem
                transaction={item.transaction}
                t={t}
                onPress={handleTransactionPress}
            />
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#5844ED" />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <Text style={styles.errorText}>{t('transactions.loadError')}</Text>
                <Text style={styles.errorDetails}>{error.message}</Text>
            </View>
        );
    }

    if (allTransactions.length === 0) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.headerTitle}>{t('transactions.historyTitle')}</Text>
                <View style={styles.emptyView}>
                    <Text style={styles.emptyText}>{t('transactions.empty')}</Text>
                </View>
            </View>
        );
    }


    const renderFooter = () => {
        if (isFetchingNextPage) {
            return (
                <View style={{ padding: 20 }}>
                    <ActivityIndicator size="small" color="#5844ED" />
                </View>
            );
        }

        if (!hasNextPage && allTransactions.length > 0) return (
            <Text style={styles.endOfListText}>{t('transactions.endOfList')}</Text>
        );

        if (hasNextPage) return (
            <Pressable
                onPress={() => fetchNextPage()}
                style={({ pressed }) => [
                    styles.loadMoreButton,
                    { opacity: pressed ? 0.7 : 1 }
                ]}
            >
                <Text style={styles.loadMoreText}>{t('transactions.loadMore')}</Text>
            </Pressable>
        );
        return null;
    };


    return (
        <View style={styles.container}>
            <View style={{ paddingHorizontal: 25, paddingTop: insets.top + 20, marginBottom: 15 }}>
                <Text style={styles.headerTitle}>{t('transactions.historyTitle')}</Text>
            </View>

            <FlatList
                data={flatListData}
                keyExtractor={(item) => item.key}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={renderFooter}
                onEndReachedThreshold={0.5}
                onEndReached={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                        fetchNextPage();
                    }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333333',
    },
    listContent: {
        paddingHorizontal: 25,
        paddingBottom: 40,
    },
    dateHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#99A2AD',
        marginTop: 15,
        marginBottom: 8,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    iconText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    itemDetails: {
        flex: 1,
    },
    itemType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
    itemDate: {
        fontSize: 13,
        color: '#99A2AD',
        marginTop: 2,
    },
    itemAmountContainer: {
        alignItems: 'flex-end',
        maxWidth: '50%',
    },
    itemMainInfo: {
        fontSize: 16,
        fontWeight: '700',
    },
    itemMainInfoExchange: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333333',
        textAlign: 'right',
    },
    loadMoreButton: {
        backgroundColor: '#5844ED',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: "#5844ED",
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    loadMoreText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    endOfListText: {
        textAlign: 'center',
        color: '#99A2AD',
        marginTop: 20,
        fontSize: 14,
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
    emptyView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#99A2AD',
        textAlign: 'center',
    }
});
