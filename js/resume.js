import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

async function loadResume() {

    const resumeButtons = document.getElementById("resumeButtons");
    const resumeDescription = document.getElementById("resumeDescription");

    try {

        const docRef = doc(db, "resume", "current");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {

            const data = docSnap.data();

            resumeDescription.innerHTML = data.title;

            resumeButtons.innerHTML = `
                <a href="${data.pdfUrl}" class="btn" target="_blank">
                    Download Resume
                </a>

                <br><br>

                <a href="${data.pdfUrl}" class="btn" target="_blank">
                    View Resume
                </a>
            `;

        } else {

            resumeDescription.innerHTML = "No Resume Available";

            resumeButtons.innerHTML = "";

        }

    } catch (error) {

        console.error(error);

    }

}

loadResume();