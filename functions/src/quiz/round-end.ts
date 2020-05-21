import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { HttpsError } from 'firebase-functions/lib/providers/https';

export const QuizRoundEnd = functions
    .region('europe-west2')
    .https
    .onCall(async (data, context) => {
        if (!context.auth) {
            throw new HttpsError('unauthenticated', 'Missing credentials');
        }

        const gameRef = await admin.firestore()
            .collection('games')
            .doc(data.quizId);

        const gameData = (await gameRef.get()).data();

        if (!gameData || !gameData.hosts.includes(context.auth.uid)) {
            throw new HttpsError('permission-denied', 'User is not a game host');
        }

        const quizRef = admin.firestore()
            .collection('quizzes')
            .doc(data.quizId);

        const quizData = (await quizRef.get()).data();

        if (!quizData) {
            throw new HttpsError('not-found', 'Not Found');
        }

        const roundRef = quizRef
            .collection('rounds')
            .doc(data.roundId);

        const questions = await roundRef
            .collection('questions')
            .listDocuments();

        // Perform updates
        const batch = admin.firestore().batch();

        // Set to next round (unless no more rounds)
        const roundIdx = quizData.roundList.indexOf(data.roundId) + 1;

        if (quizData.roundList.length > roundIdx) {
            batch.update(quizRef, { currentRound: quizData.roundList[ roundIdx ], currentQuestion: null });
        }

        // Calculate player scores
        const leaderboard: any = {};

        await Promise.all(questions.map(async (questionRef): Promise<void> => {
            const choices = await questionRef.collection('choices').get();
            const validAnswers = choices.docs
                .map((choice) => choice.data())
                .filter((choice) => choice.correct)
                .map((choice) => choice.uid);

            const answerRef = await questionRef
                .collection('answers')
                .get();

            answerRef.docs.map((answer) => {
                const answerData = answer.data();
                if (!answerData) {
                    return;
                }

                if (validAnswers.length !== answerData.response.length) {
                    return;
                }

                const checkedAnswers = validAnswers.reduce((matches, valid) => {
                    if (answerData.response.includes(valid)) {
                        return [...matches, valid];
                    }
                    return matches;
                }, []);

                if (validAnswers.length === checkedAnswers.length) {
                    const userId = answer.data().userId;
                    leaderboard[ userId ] = { userId, score: leaderboard[ userId ] ? ++leaderboard[ userId ].score : 1 };
                }
            });
        }));

        // Set player results for the round
        Object.keys(leaderboard).map((key) => {
            const resultRef = roundRef
                .collection('results')
                .doc(key);

            batch.set(resultRef, leaderboard[ key ]);
        });

        await batch.commit();
    });
