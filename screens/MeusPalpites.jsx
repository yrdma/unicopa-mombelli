import { useState, useEffect } from "react"
import { StyleSheet, Text, View, ActivityIndicator, FlatList, SafeAreaView, Image, TouchableOpacity } from "react-native"
import { supabase } from "../utils/supabase.js"
import { formatarData } from "../utils/DateFormat.js"
import { TEAM_FLAGS } from "../utils/flagMapping.js"

export default function MeusPalpites({ userId }) {
    const [palpitesComJogos, setPalpitesComJogos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtroAtivo, setFiltroAtivo] = useState("todos")

    useEffect(() => {
        carregarMeusPalpites()
    }, [])

    async function carregarMeusPalpites() {
        try {
            setLoading(true)

            const { data, error } = await supabase
                .from("palpites")
                .select(`
                    id,
                    placar_time_casa,
                    placar_time_fora,
                    jogos (
                        id,
                        time_casa,
                        time_fora,
                        sigla_casa,
                        sigla_fora,
                        data_brasilia,
                        hora_brasilia
                    )
                `)
                .eq("id_usuario", userId)

            if (error) throw error

            const listaFormatada = (data || []).map(p => {
                const jogo = p.jogos
                const horarioJogo = new Date(`${jogo.data_brasilia} ${jogo.hora_brasilia}`)
                const encerrado = new Date() >= horarioJogo

                return {
                    id_palpite: p.id,
                    placar_palpite_casa: p.placar_time_casa,
                    placar_palpite_fora: p.placar_time_fora,
                    jogoId: jogo.id,
                    time_casa: jogo.time_casa,
                    time_fora: jogo.time_fora,
                    sigla_casa: jogo.sigla_casa,
                    sigla_fora: jogo.sigla_fora,
                    data_brasilia: jogo.data_brasilia,
                    hora_brasilia: jogo.hora_brasilia,
                    encerrado: encerrado
                }
            }).sort((a, b) => {
                return new Date(`${a.data_brasilia} ${a.hora_brasilia}`) - new Date(`${b.data_brasilia} ${b.hora_brasilia}`)
            })

            setPalpitesComJogos(listaFormatada)
        } catch (error) {
            alert("Erro ao carregar seu histórico: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const palpitesFiltrados = palpitesComJogos.filter(item => {
        if (filtroAtivo === "encerrados") return item.encerrado
        if (filtroAtivo === "abertos") return !item.encerrado
        return true
    })

    function renderCardPalpite({ item }) {
        const timeCasaFlag = TEAM_FLAGS[item.sigla_casa]
        const timeForaFlag = TEAM_FLAGS[item.sigla_fora]
        const dataExibicao = formatarData(item.data_brasilia)

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.textoHorario}>
                        {dataExibicao} às {item.hora_brasilia?.slice(0, 5)}
                    </Text>
                    <View style={[styles.badge, item.encerrado ? styles.badgeEncerrado : styles.badgeAberto]}>
                        <Text style={styles.badgeTexto}>
                            {item.encerrado ? "ENCERRADO" : "CONFIRMADO"}
                        </Text>
                    </View>
                </View>

                <View style={styles.confrontoContainer}>
                    <View style={styles.timeContainer}>
                        {timeCasaFlag && <Image source={timeCasaFlag} style={styles.bandeira} />}
                        <Text style={styles.nomeTime} numberOfLines={1}>{item.time_casa}</Text>
                    </View>

                    <View style={styles.placarContainer}>
                        <View style={styles.blocoPlacar}>
                            <Text style={styles.textoPlacar}>{item.placar_palpite_casa}</Text>
                        </View>
                        <Text style={styles.X}>X</Text>
                        <View style={styles.blocoPlacar}>
                            <Text style={styles.textoPlacar}>{item.placar_palpite_fora}</Text>
                        </View>
                    </View>

                    <View style={styles.timeContainer}>
                        {timeForaFlag && <Image source={timeForaFlag} style={styles.bandeira} />}
                        <Text style={styles.nomeTime} numberOfLines={1}>{item.time_fora}</Text>
                    </View>
                </View>

                <Text style={styles.textoInformativo}>
                    {item.encerrado
                        ? "Palpite bloqueado para alterações"
                        : "Seu palpite está computado para este jogo"}
                </Text>
            </View>
        )
    }

    if (loading) {
        return (
            <View style={styles.containerLoading}>
                <ActivityIndicator size="large" color="#f2cc2f" />
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.containerFiltros}>
                <TouchableOpacity
                    style={[styles.botaoFiltro, filtroAtivo === "todos" && styles.botaoFiltroAtivo]}
                    onPress={() => setFiltroAtivo("todos")}
                >
                    <Text style={[styles.textoFiltro, filtroAtivo === "todos" && styles.textoFiltroAtivo]}>Todos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.botaoFiltro, filtroAtivo === "abertos" && styles.botaoFiltroAtivo]}
                    onPress={() => setFiltroAtivo("abertos")}
                >
                    <Text style={[styles.textoFiltro, filtroAtivo === "abertos" && styles.textoFiltroAtivo]}>Em Aberto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.botaoFiltro, filtroAtivo === "encerrados" && styles.botaoFiltroAtivo]}
                    onPress={() => setFiltroAtivo("encerrados")}
                >
                    <Text style={[styles.textoFiltro, filtroAtivo === "encerrados" && styles.textoFiltroAtivo]}>Encerrados</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={palpitesFiltrados}
                keyExtractor={(item) => item.id_palpite.toString()}
                renderItem={renderCardPalpite}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={
                    <View style={styles.containerVazio}>
                        <Text style={styles.textoVazioTitulo}>Nenhum registro encontrado</Text>
                        <Text style={styles.textoVazioSub}>Você ainda não cadastrou palpites correspondentes a este filtro.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#040b13",
    },
    containerLoading: {
        flex: 1,
        backgroundColor: "#040b13",
        justifyContent: "center",
        alignItems: "center",
    },
    containerFiltros: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderColor: "#1e2d3d",
    },
    botaoFiltro: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#1e2d3d",
        alignItems: "center",
        backgroundColor: "#0c1b2a"
    },
    botaoFiltroAtivo: {
        backgroundColor: "#f2cc2f",
        borderColor: "#f2cc2f",
    },
    textoFiltro: {
        color: "#8fa3b8",
        fontSize: 12,
        fontWeight: "bold",
    },
    textoFiltroAtivo: {
        color: "#040b13",
    },
    lista: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    card: {
        padding: 16,
        marginBottom: 16,
        backgroundColor: "#0c1b2a",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1e2d3d",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    textoHorario: {
        color: "#8fa3b8",
        fontSize: 12,
        fontWeight: "500",
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeAberto: {
        backgroundColor: "rgba(46, 204, 113, 0.15)",
        borderWidth: 0.5,
        borderColor: "#2ecc71"
    },
    badgeEncerrado: {
        backgroundColor: "rgba(231, 76, 60, 0.15)",
        borderWidth: 0.5,
        borderColor: "#e74c3c"
    },
    badgeTexto: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#ffffff"
    },
    confrontoContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    timeContainer: {
        flex: 1,
        alignItems: "center",
    },
    bandeira: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginBottom: 6,
    },
    nomeTime: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "600",
        textAlign: "center",
    },
    placarContainer: {
        width: 120,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    blocoPlacar: {
        width: 36,
        height: 36,
        backgroundColor: "#040b13",
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#1e2d3d",
        justifyContent: "center",
        alignItems: "center",
    },
    textoPlacar: {
        color: "#f2cc2f",
        fontSize: 18,
        fontWeight: "bold",
    },
    X: {
        marginHorizontal: 10,
        color: "#8fa3b8",
        fontSize: 14,
        fontWeight: "bold",
    },
    textoInformativo: {
        textAlign: "center",
        fontSize: 11,
        color: "#8fa3b8",
        borderTopWidth: 1,
        borderColor: "#1e2d3d",
        paddingTop: 10,
        marginTop: 4,
    },
    containerVazio: {
        marginTop: 60,
        alignItems: "center",
        paddingHorizontal: 20,
    },
    textoVazioTitulo: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 6,
    },
    textoVazioSub: {
        color: "#8fa3b8",
        fontSize: 13,
        textAlign: "center",
        lineHeight: 18,
    }
})