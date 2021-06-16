import React, { Component } from 'react';
import { Dimensions, StyleSheet, Text, View, StatusBar, Alert, TouchableOpacity, Image, AppState } from 'react-native';
import Matter from "matter-js";
import { GameEngine } from "react-native-game-engine";
import Bird from './Bird';
import Floor from './Floor';
import Physics, { resetPipes } from './Physics';
import Constants from './Constants';
import Images from './assets/Images';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            running: true,
            score: 0,
            highScore: 0,
            appState: AppState.currentState
        };

        this.gameEngine = null;

        this.entities = this.setupWorld();
    }

    componentDidMount() {
        this.getHighScore();
        AppState.addEventListener('change', this._handleAppStateChange);
    }

    getHighScore = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('@highScore')
            if (jsonValue !== null) {
                this.setState({
                    highScore: parseInt(JSON.parse(jsonValue).score)
                })
            }
        } catch (error) {

        }
    }

    saveHighScore = async (score) => {
        try {
            let highScore = {
                score: score
            }
            await AsyncStorage.setItem('@highScore', JSON.stringify(highScore));
        } catch (error) {

        }
    }

    setupWorld = () => {
        let engine = Matter.Engine.create({ enableSleeping: false });
        let world = engine.world;
        world.gravity.y = 0.0;

        let bird = Matter.Bodies.rectangle(Constants.MAX_WIDTH / 2, Constants.MAX_HEIGHT / 2, Constants.BIRD_WIDTH, Constants.BIRD_HEIGHT);

        let floor1 = Matter.Bodies.rectangle(
            Constants.MAX_WIDTH / 2,
            Constants.MAX_HEIGHT - 25,
            Constants.MAX_WIDTH + 4,
            50,
            { isStatic: true }
        );

        let floor2 = Matter.Bodies.rectangle(
            Constants.MAX_WIDTH + (Constants.MAX_WIDTH / 2),
            Constants.MAX_HEIGHT - 25,
            Constants.MAX_WIDTH + 4,
            50,
            { isStatic: true }
        );

        let ceiling = Matter.Bodies.rectangle(Constants.MAX_WIDTH / 2, 0, Constants.MAX_WIDTH, 50, { isStatic: true })

        Matter.World.add(world, [bird, floor1, floor2, ceiling]);
        Matter.Events.on(engine, 'collisionStart', (event) => {
            var pairs = event.pairs;

            this.gameEngine.dispatch({ type: "game-over" });

        });

        return {
            physics: { engine: engine, world: world },
            floor1: { body: floor1, renderer: Floor },
            floor2: { body: floor2, renderer: Floor },
            ceiling: { body: ceiling, renderer: Floor },
            bird: { body: bird, pose: 1, renderer: Bird },
        }
    }

    onEvent = (e) => {
        if (e.type === "game-over") {
            //Alert.alert("Game Over");
            if (this.state.score > this.state.highScore) {
                this.saveHighScore(this.state.score);
                this.setState({
                    highScore: this.state.score
                })
            }
            this.setState({
                running: false
            });
        } else if (e.type === "score") {
            this.setState({
                score: this.state.score + 1
            })
        }
    }

    reset = () => {
        resetPipes();
        this.gameEngine.swap(this.setupWorld());
        this.setState({
            running: true,
            score: 0
        });
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this._handleAppStateChange);
    }

    _handleAppStateChange = (nextAppState) => {
        if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
            resetPipes();
            this.gameEngine.swap(this.setupWorld());
            this.setState({
                running: true,
                score: 0
            });
        }
        this.setState({ appState: nextAppState });
    }

    render() {
        return (
            <View style={styles.container}>
                <Image source={Images.background} style={styles.backgroundImage} resizeMode="stretch" />
                <GameEngine
                    ref={(ref) => { this.gameEngine = ref; }}
                    style={styles.gameContainer}
                    systems={[Physics]}
                    running={this.state.running}
                    onEvent={this.onEvent}
                    entities={this.entities}>
                    <StatusBar hidden={true} />
                </GameEngine>
                <Text style={styles.score}>{this.state.score}</Text>
                {!this.state.running && <TouchableOpacity style={styles.fullScreenButton} onPress={this.reset}>
                    <View style={styles.fullScreen}>
                        <Text style={styles.gameOverText}>Game Over</Text>
                        <Text style={styles.gameOverSubText}>Try Again</Text>
                        <Text style={styles.gameOverSubText}>Score: {this.state.score}</Text>
                        <Text style={styles.gameOverSubText}>High Score: {this.state.highScore}</Text>
                    </View>
                </TouchableOpacity>}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: Constants.MAX_WIDTH,
        height: Constants.MAX_HEIGHT
    },
    gameContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    gameOverText: {
        color: 'white',
        fontSize: 48,
        fontFamily: '04b_19'
    },
    gameOverSubText: {
        color: 'white',
        fontSize: 24,
        fontFamily: '04b_19'
    },
    fullScreen: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'black',
        opacity: 0.8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    score: {
        position: 'absolute',
        color: 'white',
        fontSize: 72,
        top: 50,
        alignSelf: 'center',
        textShadowColor: '#444444',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 2,
        fontFamily: '04b_19'
    },
    fullScreenButton: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        flex: 1
    }
});
