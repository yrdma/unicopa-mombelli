import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import GameCard from './GameCard'
import { formatarData } from '../utils/DateFormat.js'

export default function DiaCard({ data, jogos }) {
    
    const hoje = formatarData(new Date())
    const isDataAtual = data === hoje



    return (
        <View style={[styles.card, isDataAtual && styles.jogoDeHoje]}>
            <Text style={styles.data}>
                {data}
            </Text>
            {
                jogos.map((jogo) => (
                    <GameCard key={jogo.id} game={jogo} />
                ))
            }
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        marginTop: 20,
        backgroundColor: '#0c1b2a',
        width: 320,
        borderRadius: 12,
        padding: 15,
    },
    data: {
        color: '#f2cc2f',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10
    },
    jogoDeHoje: {
        backgroundColor: '#000000',
    }
})