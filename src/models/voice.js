import {
    db
} from "../configs/firebase.js";
import {
    collection,
    query,
    getDocs,
    orderBy
} from "firebase/firestore";

const voice = async () => {
    const tblVoice = collection(db, "Voice");
    const qryVoice = query(tblVoice, orderBy("created", "asc"));
    const docVoice = await getDocs(qryVoice);

    const result = [];

    docVoice.forEach((doc) => {
        result.push({
            id: doc.id,
            ...doc.data()
        });
    });

    return result;
};

export {
    voice
}