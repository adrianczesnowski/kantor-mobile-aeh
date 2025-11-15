import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactions, ITransaction, TransactionType } from '@/services/transaction.service';
import { fetchWallets, IWallet } from '@/services/wallet.service';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TransactionItemProps {
  transaction: ITransaction;
  t: (key: string) => string;
  onPress: (id: string) => void;
}

const getTransactionColor = (type: TransactionType) => {
  switch (type) {
    case 'topup': return '#2ECC71';
    case 'exchange': return '#5844ED';
    case 'withdraw': return '#E74C3C';
    default: return '#333333';
  }
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
      style={({ pressed }) => [styles.itemContainer, { opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + '1A' }]}>
        <Text style={[styles.iconText, { color }]}>{type.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemType}>{t(`transactions.type.${type}`)}</Text>
        <Text style={styles.itemDate}>{format(new Date(timestamp), 'HH:mm', { locale: pl })}</Text>
      </View>
      <View style={styles.itemAmountContainer}>{renderMainInfo()}</View>
    </Pressable>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SPACING = 20;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_SPACING * 2) - 40;

const WalletCard = ({ wallet }: { wallet: IWallet }) => (
  <View style={styles.walletCard}>
    <Text style={styles.walletCardLabel}>{`Saldo ${wallet.currency}`}</Text>
    <Text style={styles.walletCardBalance}>
      {parseFloat(wallet.balance).toLocaleString('pl-PL', {
        style: 'currency',
        currency: wallet.currency,
        minimumFractionDigits: 2,
      })}
    </Text>
  </View>
);

const ActionIcon = ({ label, iconName, onPress }: {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.actionIconContainer, { opacity: pressed ? 0.7 : 1 }]}
  >
    <View style={styles.actionIconCircle}>
      <MaterialCommunityIcons name={iconName} size={28} color="#5844ED" />
    </View>
    <Text style={styles.actionIconLabel}>{label}</Text>
  </Pressable>
);

const WalletCarousel = ({ wallets }: { wallets: IWallet[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const itemWidthWithSpacing = CARD_WIDTH + CARD_SPACING;
    const index = Math.round(offsetX / itemWidthWithSpacing);
    setActiveIndex(Math.max(0, Math.min(index, wallets.length - 1)));
  };

  return (
    <View>
      <FlatList
        data={wallets}
        keyExtractor={(item) => item.currency}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: CARD_SPACING,
        }}
        ItemSeparatorComponent={() => <View style={{ width: CARD_SPACING }} />}
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH }}>
            <WalletCard wallet={item} />
          </View>
        )}
      />
      <View style={styles.paginationContainer}>
        {wallets.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
    </View>
  );
};


export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: walletsData, isLoading: isLoadingWallets, error: errorWallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: fetchWallets,
  });

  const { data: recentTransactionsData, isLoading: isLoadingTransactions, error: errorTransactions } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: () => fetchTransactions(5, 0),
  });

  const wallets: IWallet[] = walletsData || [];
  const recentTransactions: ITransaction[] = recentTransactionsData || [];

  const handleTransactionPress = (id: string) => router.push(`/transactions/${id}`);

  if (isLoadingWallets || isLoadingTransactions) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#5844ED" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (errorWallets || errorTransactions) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{t('home.loadError')}</Text>
        <Text style={styles.errorDetails}>
          {errorWallets?.message || errorTransactions?.message}
        </Text>
      </View>
    );
  }


  const renderHeader = () => (
    <View>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>
          <Text style={styles.logoPrimary}>kantor</Text>
          <Text style={styles.logoSecondary}>.com</Text>
        </Text>
      </View>

      <WalletCarousel wallets={wallets} />

      <View style={styles.actionsContainer}>
        <ActionIcon
          label={t('home.addMoney')}
          iconName="plus"
          onPress={() => router.push('/topup')}
        />
        <ActionIcon
          label={t('home.exchange')}
          iconName="swap-horizontal"
          onPress={() => router.push('/exchange')}
        />
        <ActionIcon
          label={t('home.withdraw')}
          iconName="arrow-down"
          onPress={() => router.push('/withdraw')}
        />
      </View>

      <View style={styles.transactionsHeaderContainer}>
        <Text style={styles.sectionTitle}>{t('home.recentTransactions')}</Text>
        <Pressable onPress={() => router.push('/transactions')}>
          <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={recentTransactions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TransactionItem transaction={item} t={t} onPress={handleTransactionPress} />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyText}>{t('transactions.empty')}</Text>
          </View>
        }
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
  },
  logoPrimary: { color: '#5844ED' },
  logoSecondary: { color: '#333333' },
  listContent: {
    paddingHorizontal: CARD_SPACING,
    paddingBottom: 40,
  },
  walletCard: {
    height: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    justifyContent: 'center',
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  walletCardLabel: {
    fontSize: 16,
    color: '#99A2AD',
    fontWeight: '500',
  },
  walletCardBalance: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333333',
    marginTop: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  dotActive: { backgroundColor: '#5844ED' },
  dotInactive: { backgroundColor: '#C4C4C4' },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  actionIconContainer: {
    alignItems: 'center',
    width: 80,
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28, // 56 / 2
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 8,
  },
  actionIconLabel: {
    color: '#333333',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  transactionsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#333333' },
  seeAllText: { fontSize: 15, fontWeight: '600', color: '#5844ED' },
  loadingText: { color: '#5844ED', marginTop: 10 },
  errorText: { fontSize: 18, color: '#E74C3C', marginBottom: 5, textAlign: 'center' },
  errorDetails: { color: '#333333', textAlign: 'center' },
  emptyView: { paddingVertical: 50, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#99A2AD', textAlign: 'center' },
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
  iconText: { fontSize: 18, fontWeight: 'bold' },
  itemDetails: { flex: 1 },
  itemType: { fontSize: 16, fontWeight: '600', color: '#333333' },
  itemDate: { fontSize: 13, color: '#99A2AD', marginTop: 2 },
  itemAmountContainer: { alignItems: 'flex-end', maxWidth: '50%' },
  itemMainInfo: { fontSize: 16, fontWeight: '700' },
  itemMainInfoExchange: { fontSize: 15, fontWeight: '600', color: '#333333', textAlign: 'right' },
});
