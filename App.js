import React, { useState, useEffect, useRef, useCallback } from 'react';

import { StyleSheet, View, Text, Button } from 'react-native';
import Vosk from 'react-native-vosk';
import BackgroundService from 'react-native-background-actions';
import Tts from 'react-native-tts';
export default function App() {
  const [ready, setReady] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [result, setResult] = useState();

  const vosk = useRef(new Vosk()).current;

  const load = useCallback(async () => {
    vosk
      .loadModel('model-small-es')
      // .loadModel('model-en-us')
      .then(() => setReady(true))
      .catch((e) => console.error(e));
  }, [vosk]);

  const record = async () => {
    vosk
      .start()
      .then(() => {
        console.log('Starting recognition...');
        setRecognizing(true);
      })
      .catch((e) => console.error(e));
  };

  const recordGrammar = () => {
    vosk
      .start()
      .then(() => {
        console.log('Starting recognition with grammar...');
        setRecognizing(true);
      })
      .catch((e) => console.error(e));
  };

  const recordTimeout = () => {
    vosk
      .start({ timeout: 5000 })
      .then(() => {
        console.log('Starting recognition with timeout...');
        setRecognizing(true);
      })
      .catch((e) => console.error(e));
  };

  const stop = () => {
    vosk.stop();
    console.log('Stoping recognition...');
    setRecognizing(false);
  };

  const unload = useCallback(() => {
    vosk.unload();
    setReady(false);
    setRecognizing(false);
  }, [vosk]);

  const startBackgroundService = useCallback(async () => {
    const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));

    const task = async () => {
      await new Promise(async (resolve) => {
          if (!recognizing) {
            console.log(recognizing)
            vosk.loadModel('model-small-es')
            .then(() => {
              setReady(true)
              console.log('hola')
            }).then(() => {
              record();
            })
          }
          await sleep(1000); // Mantener en espera un segundo
      });
    };

    await BackgroundService.start(task, {
      taskName: 'Voice Assistant',
      taskTitle: 'Asistente de Voz activo',
      taskDesc: 'Escuchando comandos de voz...',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
      color: '#ff00ff',
      parameters: {
        delay: 1000,
      },
      notifications: {
        color: 'red',
      },
    });
  }, [vosk])

  useEffect(() => {
    const resultEvent = vosk.onResult((res) => {
      console.log('An onResult event has been caught: ' + res);
      setResult(res);
    });

    const partialResultEvent = vosk.onPartialResult((res) => {
      setResult(res);
    });

    const finalResultEvent = vosk.onFinalResult((res) => {
      setResult(res);
    });

    const errorEvent = vosk.onError((e) => {
      console.error(e);
    });

    const timeoutEvent = vosk.onTimeout(() => {
      console.log('Recognizer timed out');
      setRecognizing(false);
    });

    startBackgroundService();
    return () => {
      resultEvent.remove();
      partialResultEvent.remove();
      finalResultEvent.remove();
      errorEvent.remove();
      timeoutEvent.remove();
    };
  }, [vosk]);


  useEffect(() => {
    console.log(result, toString(result).toLowerCase().includes('juan confirma mis viajes'))
    if(typeof result == 'string'){
      if(result.toLowerCase().includes('juan confirma mis viajes')){
        console.log('Should work!')
        Tts.speak('Confirmando viajes!')
      }
    }
  }, [result])

  return (
    <View style={styles.container}>
      <Button
        onPress={ready ? unload : load}
        title={ready ? 'Unload model' : 'Load model'}
        color="blue"
      />

      {!recognizing && (
        <View style={styles.recordingButtons}>
          <Button
            title="Record"
            onPress={record}
            disabled={!ready}
            color="green"
          />

          <Button
            title="Record with grammar"
            onPress={recordGrammar}
            disabled={!ready}
            color="green"
          />

          <Button
            title="Record with timeout"
            onPress={recordTimeout}
            disabled={!ready}
            color="green"
          />
        </View>
      )}

      {recognizing && <Button onPress={stop} title="Stop" color="red" />}

      <Text>Recognized word:</Text>
      <Text>{result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 25,
    flex: 1,
    display: 'flex',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButtons: {
    gap: 15,
    display: 'flex',
  },
});