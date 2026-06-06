import { useState, useEffect } from "react"
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, FlatList, SafeAreaView, Image, Modal, ScrollView } from "react-native"
import { supabase } from "../utils/supabase.js"
import { formatarData } from "../utils/DateFormat.js"
import { TEAM_FLAGS } from "../utils/flagMapping.js"

export default function Palpites({ userId }) {
    const [jogos, setJogos] = useState([])
    const [palpites, setPalpites] = useState({})
    const [loading, setLoading] = useState(true)
    const [salvandoId, setSalvandoId] = useState(null)
    const [palpitesSalvos, setPalpitesSalvos] = useState({})
    const [modalVisivel, setModalVisivel] = useState(false)
    const [enviandoLote, setEnviandoLote] = useState(false)

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
                    placar_time_casa: p.placar_time_casa?.toString() ?? "",
                    placar_time_fora: p.placar_time_fora?.toString() ?? ""
                }
            })

            const jogosOrdenados = (jogosData || []).sort((a, b) => {
                return new Date(`${a.data_brasilia} ${a.hora_brasilia}`) - new Date(`${b.data_brasilia} ${b.hora_brasilia}`)
            })

            setJogos(jogosOrdenados)
            setPalpites(mapaPalpites)
            setPalpitesSalvos(JSON.parse(JSON.stringify(mapaPalpites)))
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

        if (!palpiteJogo?.placar_time_casa ||  !palpiteJogo?.placar_time_fora) {
            alert("Preencha ambos os placares antes de salvar!")
            return
        }

        try {
            setSalvandoId(jogoId)

            const { error } = await supabase
                .from("palpites")
                .upsert({
                    id_usuario: userId,
                    id_jogo: jogoId,
                    placar_time_casa: parseInt(palpiteJogo.placar_time_casa),
                    placar_time_fora: parseInt(palpiteJogo.placar_time_fora)
                }, {
                    onConflict: "id_usuario,id_jogo"
                })

            if (error) throw error

            setPalpitesSalvos(prev => ({
                ...prev,
                [jogoId]: {
                    placar_time_casa: palpiteJogo.placar_time_casa,
                    placar_time_fora: palpiteJogo.placar_time_fora
                }
            }))

            alert("Palpite salvo com sucesso! ⚽")
        } catch (error) {
            alert("Erro ao salvar: " + error.message)
        } finally {
            setSalvandoId(null)
        }
    }

    async function enviarTodosPalpites() {
        const palpitesValidos = jogosParaRevisar.map(jogo => ({
            id_usuario: userId,
            id_jogo: jogo.id,
            placar_time_casa: parseInt(palpites[jogo.id].placar_time_casa),
            placar_time_fora: parseInt(palpites[jogo.id].placar_time_fora)
        }))

        if (palpitesValidos.length === 0) {
            alert("Você não possui novos palpites preenchidos para enviar.")
            setModalVisivel(false)
            return
        }

        try {
            setEnviandoLote(true)

            const { error } = await supabase
                .from("palpites")
                .upsert(palpitesValidos, { 
                    onConflict: "id_usuario,id_jogo",
                    ignoreDuplicates: false 
                })

            if (error) throw error

            alert(`Sucesso! ${palpitesValidos.length} palpites salvos/enviados de uma vez!`)
            setModalVisivel(false)
            
            carregarDados() 
        } catch (error) {
            alert("Erro ao processar lote de palpites: " + error.message)
        } finally {
            setEnviandoLote(false)
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
                            value={palpiteAtual.placar_time_casa}
                            onChangeText={(val) => handleMudarPlacar(jogo.id, "placar_time_casa", val)}
                        />
                        <Text style={styles.X}>X</Text>
                        <TextInput
                            style={[styles.inputPlacar, bloqueado && styles.inputBloqueado]}
                            keyboardType="numeric"
                            maxLength={2}
                            editable={!bloqueado}
                            value={palpiteAtual.placar_time_fora}
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
                            {bloqueado ? "PALPITES ENCERRADOS" : "SALVAR ESTE PALPITE"}
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

    const jogosParaRevisar = jogos.filter(jogo => {
        const horarioJogo = new Date(`${jogo.data_brasilia} ${jogo.hora_brasilia}`)
        const bloqueado = new Date() >= horarioJogo

        if (bloqueado) {
            return false
        }

        const pAtual = palpites[jogo.id]
        const pSalvo = palpitesSalvos[jogo.id]
        const temPalpiteDigitado = pAtual?.placar_time_casa !== "" && pAtual?.placar_time_casa != null && pAtual?.placar_time_fora !== "" && pAtual?.placar_time_fora != null
        const mudouCasa = pAtual?.placar_time_casa !== pSalvo?.placar_time_casa
        const mudouFora = pAtual?.placar_time_fora !== pSalvo?.placar_time_fora

        return temPalpiteDigitado && (mudouCasa || mudouFora)
    })

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={jogos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItemJogo}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={<Text style={styles.textoVazio}>Nenhum jogo disponível para palpites.</Text>}
            />

            {jogosParaRevisar.length > 0 && (
                <TouchableOpacity 
                    style={styles.botaoFlutuanteRevisar}
                    onPress={() => setModalVisivel(true)}
                >
                    <Text style={styles.textoBotaoFlutuante}>REVISAR E CONFIRMAR ({jogosParaRevisar.length})</Text>
                </TouchableOpacity>
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisivel}
                onRequestClose={() => setModalVisivel(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalConteudo}>
                        <Text style={styles.modalTitulo}>Revisar Meus Palpites</Text>
                        <Text style={styles.modalSubtitulo}>Confira abaixo suas apostas antes do envio definitivo:</Text>

                        <ScrollView style={styles.modalScroll}>
                            {jogosParaRevisar.map(jogo => {
                                return (
                                    <View key={jogo.id} style={styles.revisaoLinha}>
                                        <Text style={styles.revisaoTimeText} numberOfLines={1}>{jogo.sigla_casa}</Text>
                                        <Text style={styles.revisaoPlacar}>
                                            {palpites[jogo.id]?.placar_time_casa}
                                        </Text>
                                        <Text style={styles.revisaoX}>x</Text>
                                        <Text style={styles.revisaoPlacar}>
                                            {palpites[jogo.id]?.placar_time_fora}
                                        </Text>
                                        <Text style={[styles.revisaoTimeText, {textAlign: 'right'}]} numberOfLines={1}>{jogo.sigla_fora}</Text>
                                    </View>
                                )
                            })}
                        </ScrollView>

                        <View style={styles.modalBotoesContainer}>
                            <TouchableOpacity 
                                style={styles.modalBotaoVoltar}
                                onPress={() => setModalVisivel(false)}
                                disabled={enviandoLote}
                            >
                                <Text style={styles.textoBotaoVoltar}>CORRIGIR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.modalBotaoConfirmar}
                                onPress={enviarTodosPalpites}
                                disabled={enviandoLote}
                            >
                                {enviandoLote ? (
                                    <ActivityIndicator color="#040b13" />
                                ) : (
                                    <Text style={styles.textoBotaoConfirmar}>CONFIRMAR E ENVIAR</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingBottom: 80, 
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
    botaoFlutuanteRevisar: {
        position: 'absolute',
        bottom: 15,
        alignSelf: 'center',
        backgroundColor: '#f2cc2f',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 6
    },
    textoBotaoFlutuante: {
        color: '#040b13',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 0.5
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(4, 11, 19, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalConteudo: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: '#0c1b2a',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1e2d3d',
        padding: 20,
    },
    modalTitulo: {
        color: '#f2cc2f',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 6
    },
    modalSubtitulo: {
        color: '#8fa3b8',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 16
    },
    modalScroll: {
        marginBottom: 20
    },
    revisaoLinha: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#040b13',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#1e2d3d'
    },
    revisaoTimeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        flex: 1
    },
    revisaoPlacar: {
        color: '#f2cc2f',
        fontSize: 18,
        fontWeight: '900',
        width: 30,
        textAlign: 'center'
    },
    revisaoX: {
        color: '#8fa3b8',
        marginHorizontal: 6,
        fontSize: 12
    },
    modalBotoesContainer: {
        flexDirection: 'row',
        gap: 12
    },
    modalBotaoVoltar: {
        flex: 1,
        padding: 14,
        borderWidth: 1,
        borderColor: '#1e2d3d',
        borderRadius: 8,
        alignItems: 'center'
    },
    textoBotaoVoltar: {
        color: '#8fa3b8',
        fontWeight: 'bold'
    },
    modalBotaoConfirmar: {
        flex: 2,
        padding: 14,
        backgroundColor: '#f2cc2f',
        borderRadius: 8,
        alignItems: 'center'
    },
    textoBotaoConfirmar: {
        color: '#040b13',
        fontWeight: 'bold'
    }
})