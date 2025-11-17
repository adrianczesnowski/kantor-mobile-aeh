import {
    StyleSheet,
    View,
    TextInput,
    Pressable,
    ActivityIndicator,
    FlatList,
    Alert,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { getLatestRates, IRate } from '@/services/rates.service';
import { getCurrencyFlag } from '@/constants/currencies';

const RateItem = ({ item, onPress }: { item: IRate; onPress: () => void }) => {
    const flag = getCurrencyFlag(item.code);

    return (
        <Pressable
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
            onPress={onPress}
        >
            <Text style={styles.itemFlag}>{flag}</Text>
            <View style={styles.itemInfo}>
                <Text style={styles.itemCode}>{item.code}</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.currency}</Text>
            </View>
            <View style={styles.itemRight}>
                <Text style={styles.itemMid}>{item.mid.toFixed(4)} PLN</Text>
                <IconButton icon="chevron-right" size={24} iconColor="#99A2AD" style={styles.itemChevron} />
            </View>
        </Pressable>
    );
};


export default function RatesScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: rates, isLoading, error } = useQuery({
        queryKey: ['latestRates'],
        queryFn: getLatestRates,
    });

    const filteredRates = useMemo(() => {
        if (!rates) return [];
        if (!searchQuery) return rates;

        const lowerFilter = searchQuery.toLowerCase();
        return rates.filter((rate) => {
            const codeMatch = rate.code.toLowerCase().includes(lowerFilter);
            const nameMatch = rate.currency.toLowerCase().includes(lowerFilter);
            return codeMatch || nameMatch;
        });
    }, [rates, searchQuery]);

    const handleRatePress = (item: IRate) => {
        const flag = getCurrencyFlag(item.code);

        router.push({
            pathname: `/rates/${item.code}`,
            params: {
                name: item.currency,
                latestMid: item.mid.toString(),
                flag: flag
            }
        });
    };

    if (error) {
        Alert.alert(t('common.error', 'Wystąpił błąd'), error.message);
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={[styles.container, { paddingTop: insets.top }]}>

                <Text variant="headlineMedium" style={styles.title}>
                    {t('rates.title', 'Kursy Walut')}
                </Text>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={t('currencyPicker.searchPlaceholder', 'Szukaj waluty...')}
                        placeholderTextColor="#99A2AD"
                        selectionColor="#5844ED"
                    />
                </View>

                {isLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#5844ED" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredRates}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => (
                            <RateItem item={item} onPress={() => handleRatePress(item)} />
                        )}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Text style={styles.emptyText}>{t('rates.empty', 'Nie znaleziono walut')}</Text>
                            </View>
                        }
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 20,
        marginTop: 20,
        marginLeft: 20,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    searchInput: {
        height: 45,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    emptyText: {
        fontSize: 16,
        color: '#99A2AD',
    },
    item: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
    },
    itemInfo: {
        flex: 1,
        marginRight: 10,
    },
    itemCode: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
    },
    itemName: {
        fontSize: 13,
        color: '#99A2AD',
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemMid: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginRight: 0,
    },
    itemFlag: {
        fontSize: 28,
        marginRight: 15,
    },
    itemChevron: {
        margin: 0,
        padding: 0,
        marginLeft: 5,
    },
    separator: {
        height: 1,
        backgroundColor: '#F5F7FA',
    },
});
