import {
    db
} from "../configs/firebase.js";
import {
    collection,
    query,
    getDocs,
    orderBy
} from "firebase/firestore";

const Voice = async () => {
    const tblVoice = collection(db, "Voice");
    const qryVoice = query(tblVoice, orderBy("created", "asc"));
    const docVoice = await getDocs(qryVoice);

    const result = [];
    let no = 1;

    docVoice.forEach((doc) => {
        result.push({
            no: no++,
            id: doc.id,
            ...doc.data()
        });
    });

    return result;
};

export {
    Voice
}