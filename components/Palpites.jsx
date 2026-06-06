import { useState, useEffect } from "react"
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, FlatList, SafeAreaView, Image } from "react-native"
import { supabase } from "../utils/supabase"
import { formatarData } from "../utils/DateFormat.js"
import { TEAM_FLAGS } from "../utils/flagMapping" // Importando o mapeamento de bandeiras

export default function Palpites({ userId }) {
    const [jogos, setJogos] = useState([])
    const [palpites, setPalpites] = useState({})
    const [loading, setLoading] = useState(true)
    const [salvandoId, setSalvandoId] = useState(null)

    useEffect(() => {
        carregarDados()
    }, [])

    async function carregarDados() {
        try {
            setLoading(true)

            const { data: jogosData, error: jogosErro } = await supabase
                .from("jogos")
                .select("*")

            if (jogosErro) throw jogosErro

            const { data: palpitesData, error: palpitesErro } = await supabase
                .from("palpites")
                .select("*")
                .eq("id_usuario", userId)

            if (palpitesErro) throw palpitesErro

            const mapaPalpites = {}
            palpitesData.forEach(p => {
                mapaPalpites[p.id_jogo] = {
                    placar_time_casa: p.placar_time_casa?.toString() || "",
                    placar_time_fora: p.placar_time_fora?.toString() || ""
                }
            })

            const jogosOrdenados = (jogosData || []).sort((a, b) => {
                return new Date(`${a.data_brasilia} ${a.hora_brasilia}`) - new Date(`${b.data_brasilia} ${b.hora_brasilia}`)
            })

            setJogos(jogosOrdenados)
            setPalpites(mapaPalpites)
        } catch (error) {
            alert("Erro ao carregar os palpites: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    function handleMudarPlacar(jogoId, campo, valor) {
        const numeroLimpo = valor.replace(/[^0-9]/g, "")

        setPalpites(prev => ({
            ...prev,
            [jogoId]: {
                placar_time_casa:
                    campo === "placar_time_casa"
                        ? numeroLimpo
                        : prev[jogoId]?.placar_time_casa ?? "",

                placar_time_fora:
                    campo === "placar_time_fora"
                        ? numeroLimpo
                        : prev[jogoId]?.placar_time_fora ?? ""
            }
        }))
    }
    async function salvarPalpite(jogoId) {
        const palpiteJogo = palpites[jogoId]

        if (
            palpiteJogo?.placar_time_casa === "" ||
            palpiteJogo?.placar_time_casa == null ||
            palpiteJogo?.placar_time_fora === "" ||
            palpiteJogo?.placar_time_fora == null
        ) {
            alert("Preencha ambos os placares antes de salvar!")
            return
        }

        try {
            setSalvandoId(jogoId)

            const { error } = await supabase
                .from("palpites")
                .insert({
                    id_usuario: userId,
                    id_jogo: jogoId,
                    placar_time_casa: parseInt(palpiteJogo.placar_time_casa),
                    placar_time_fora: parseInt(palpiteJogo.placar_time_fora)
                })
                .select()

            if (error) throw error

            alert("Palpite salvo com sucesso! ⚽")
        } catch (error) {
            alert("Erro ao salvar: " + error.message)
        } finally {
            setSalvandoId(null)
        }
    }

    function renderItemJogo({ item: jogo }) {
        const horarioJogo = new Date(`${jogo.data_brasilia} ${jogo.hora_brasilia}`)
        const agora = new Date()
        const bloqueado = agora >= horarioJogo

        const palpiteAtual = {
            placar_time_casa: palpites[jogo.id]?.placar_time_casa ?? "",
            placar_time_fora: palpites[jogo.id]?.placar_time_fora ?? ""
        }
        const dataExibicao = formatarData(jogo.data_brasilia)

        const timeCasaFlag = TEAM_FLAGS[jogo.sigla_casa]
        const timeForaFlag = TEAM_FLAGS[jogo.sigla_fora]

        return (
            <View style={styles.card}>
                <Text style={styles.textoHorario}>{dataExibicao} às {jogo.hora_brasilia?.slice(0, 5)}</Text>

                <View style={styles.confrontoContainer}>
                    <View style={styles.timeContainer}>
                        {timeCasaFlag && <Image source={timeCasaFlag} style={styles.bandeira} />}
                        <Text style={styles.nomeTime} numberOfLines={1}>{jogo.time_casa}</Text>
                    </View>

                    <View style={styles.placarContainer}>
                        <TextInput
                            style={[styles.inputPlacar, bloqueado && styles.inputBloqueado]}
                            keyboardType="numeric"
                            maxLength={2}
                            editable={!bloqueado}
                            value={palpiteAtual.placar_time_casa ?? ""}
                            onChangeText={(val) => handleMudarPlacar(jogo.id, "placar_time_casa", val)}
                        />
                        <Text style={styles.X}>X</Text>
                        <TextInput
                            style={[styles.inputPlacar, bloqueado && styles.inputBloqueado]}
                            keyboardType="numeric"
                            maxLength={2}
                            editable={!bloqueado}
                            value={palpiteAtual.placar_time_fora ?? ""}
                            onChangeText={(val) => handleMudarPlacar(jogo.id, "placar_time_fora", val)}
                        />
                    </View>

                    <View style={styles.timeContainer}>
                        {timeForaFlag && <Image source={timeForaFlag} style={styles.bandeira} />}
                        <Text style={styles.nomeTime} numberOfLines={1}>{jogo.time_fora}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.botaoSalvar, bloqueado && styles.botaoBloqueado]}
                    onPress={() => salvarPalpite(jogo.id)}
                    disabled={bloqueado || salvandoId === jogo.id}
                >
                    {salvandoId === jogo.id ? (
                        <ActivityIndicator color="#040b13" />
                    ) : (
                        <Text style={styles.textoBotaoSalvar}>
                            {bloqueado ? "PALPITES ENCERRADOS" : "SALVAR PALPITE"}
                        </Text>
                    )}
                </TouchableOpacity>
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
            <FlatList
                data={jogos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItemJogo}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={<Text style={styles.textoVazio}>Nenhum jogo disponível para palpites.</Text>}
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
    lista: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    card: {
        padding: 16,
        marginBottom: 16,
        backgroundColor: "#0c1b2a",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1e2d3d",
    },
    textoHorario: {
        marginBottom: 12,
        color: "#8fa3b8",
        fontSize: 13,
        fontWeight: "500",
        textAlign: "center",
    },
    confrontoContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        marginBottom: 16,
    },
    timeContainer: {
        flex: 1,
        alignItems: "center",
    },
    bandeira: {
        width: 34,
        height: 34,
        borderRadius: 17,
        marginBottom: 6,
    },
    nomeTime: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "600",
        textAlign: "center",
    },
    placarContainer: {
        width: 110,

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    inputPlacar: {
        width: 38,
        height: 38,
        backgroundColor: "#040b13",
        color: "#ffffff",
        borderWidth: 1,
        borderColor: "#1e2d3d",
        borderRadius: 6,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
    },
    inputBloqueado: {
        backgroundColor: "#16222f",
        color: "#52657a",
    },
    X: {
        marginHorizontal: 8,
        color: "#f2cc2f",
        fontSize: 15,
        fontWeight: "bold",
    },
    botaoSalvar: {
        padding: 12,
        backgroundColor: "#f2cc2f",
        borderRadius: 8,
        alignItems: "center",
    },

    botaoBloqueado: {
        backgroundColor: "#1e2d3d",
    },
    textoBotaoSalvar: {
        color: "#040b13",
        fontSize: 13,
        fontWeight: "bold",
    },
    textoVazio: {
        marginTop: 40,
        color: "#8fa3b8",
        textAlign: "center",
    },
})