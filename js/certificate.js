import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const certificateTitle = document.getElementById("certificateTitle");
const certificateFile = document.getElementById("certificateFile");
const uploadCertificateBtn = document.getElementById("uploadCertificateBtn");
const certificateList = document.getElementById("certificateList");

uploadCertificateBtn.addEventListener("click", async () => {

    const title = certificateTitle.value.trim();
    const file = certificateFile.files[0];

    if (!title || !file) {

        alert("Please enter certificate name and select a file.");
        return;

    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", "portfolio_upload");

    try {

        const response = await fetch(
            "https://api.cloudinary.com/v1_1/eycvadb8/auto/upload",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();
        const totalCertificates = (await getDocs(collection(db, "certificates"))).size;

        await addDoc(collection(db, "certificates"), {
            title: title,
            fileUrl: data.secure_url,
            uploadedAt: serverTimestamp(),
            order: totalCertificates + 1
        });

        console.log(data);

        alert("Certificate Uploaded & Saved Successfully!");

        loadCertificates();

    } catch (error) {

        console.error(error);

        alert("Upload Failed!");

}

});


// 👇 IS LINE KE BAAD PASTE KARNA HAI

async function loadCertificates() {

    certificateList.innerHTML = "";

    const q = query(
        collection(db, "certificates"),
        orderBy("order", "asc")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {

        certificateList.innerHTML = "No Certificate Uploaded";
        return;

    }

    querySnapshot.forEach((docItem) => {

        const data = docItem.data();

        certificateList.innerHTML += `

        <div class="resume-card">

            <p>
                <strong>${data.title}</strong>
            </p>

            <div class="resume-actions">

                <button
                class="up-btn"
                data-id="${docItem.id}">
                    ⬆ Up
                </button>

                <button
                class="down-btn"
                data-id="${docItem.id}">
                    ⬇ Down
                </button>

                <a href="${data.fileUrl}"
                target="_blank"
                class="view-btn">
                    👁 View Certificate
                </a>

                <button
                class="delete-btn"
                data-id="${docItem.id}">
                    🗑 Delete Certificate
                </button>

            </div>

        </div>

        `;
        const deleteBtn = certificateList.querySelector(
            `button.delete-btn[data-id="${docItem.id}"]`
        );

        deleteBtn.addEventListener("click", async () => {

            const confirmDelete = confirm(
                "Are you sure you want to delete this certificate?"
            );

            if (!confirmDelete) return;

            await deleteDoc(doc(db, "certificates", docItem.id));

            alert("Certificate Deleted Successfully!");

            loadCertificates();

        });
       

    });

}
// Certificate Up / Down buttons

certificateList.addEventListener("click", (event) => {

    const upButton = event.target.closest(".up-btn");
    const downButton = event.target.closest(".down-btn");

    if (upButton) {

        const id = upButton.dataset.id;

        console.log("UP clicked:", id);

        moveCertificate(id, "up");

        return;
    }

    if (downButton) {

        const id = downButton.dataset.id;

        console.log("DOWN clicked:", id);

        moveCertificate(id, "down");

        return;
    }

});
async function moveCertificate(id, direction) {

    try {

        const snapshot = await getDocs(
            collection(db, "certificates")
        );

        let certificates = [];

        snapshot.forEach((item) => {

            certificates.push({
                id: item.id,
                ...item.data()
            });

        });

        certificates.sort((a, b) => {

            return (Number(a.order) || 999999)
                 - (Number(b.order) || 999999);

        });

        const currentIndex = certificates.findIndex(
            item => item.id === id
        );

        if (currentIndex === -1) {
            console.log("Certificate not found");
            return;
        }

        let newIndex;

        if (direction === "up") {

            newIndex = currentIndex - 1;

        } else if (direction === "down") {

            newIndex = currentIndex + 1;

        } else {

            return;

        }

        if (
            newIndex < 0 ||
            newIndex >= certificates.length
        ) {

            return;

        }

        // Swap position
        const temp = certificates[currentIndex];

        certificates[currentIndex] =
            certificates[newIndex];

        certificates[newIndex] = temp;


        // Save new order in Firestore
        for (let i = 0; i < certificates.length; i++) {

            await updateDoc(
                doc(db, "certificates", certificates[i].id),
                {
                    order: i + 1
                }
            );

        }

        // Reload certificates
        await loadCertificates();

    } catch (error) {

        console.error("Move Certificate Error:", error);

        alert("Move failed. F12 Console check karo.");

    }

}

loadCertificates();