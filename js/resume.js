import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    orderBy
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
async function loadCertificates() {

    const certificateContainer =
        document.getElementById("certificateContainer");

    if (!certificateContainer) return;

    certificateContainer.innerHTML = "";

    try {

        const q = query(
            collection(db, "certificates"),
            orderBy("uploadedAt", "desc")
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            certificateContainer.innerHTML =
                "<p>No Certificate Uploaded</p>";

            return;

        }

        snapshot.forEach((doc) => {

            const data = doc.data();

            certificateContainer.innerHTML += `

                <div class="dynamic-certificate">

                    <h3>🏆 ${data.title}</h3>

                    <div class="dynamic-buttons">

                    <a href="${data.fileUrl}"
                    class="btn"
                    target="_blank">
                    View Certificate
                    </a>

                    <a href="${data.fileUrl}"
                    class="btn btn2"
                    download>
                    Download Certificate
                    </a>

                    </div>

                </div>

            `;

        });

    } catch (error) {

        console.log(error);

    }

}
loadCertificates();