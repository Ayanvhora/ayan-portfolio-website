import { auth, db } from "./firebase.js";

import { signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
// Logout
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "admin.html";
});

// Navigation
const dashboardMenu = document.getElementById("dashboardMenu");
const resumeMenu = document.getElementById("resumeMenu");

const dashboardSection = document.getElementById("dashboardSection");
const resumeSection = document.getElementById("resumeSection");

dashboardMenu.addEventListener("click", () => {
    dashboardSection.style.display = "block";
    resumeSection.style.display = "none";
});

resumeMenu.addEventListener("click", () => {

    dashboardSection.style.display = "none";
    resumeSection.style.display = "block";

});
// ==========================
// Resume Upload
// ==========================

const uploadResumeBtn = document.getElementById("uploadResumeBtn");

uploadResumeBtn.addEventListener("click", uploadResume);

async function uploadResume() {

    const title = document.getElementById("resumeTitle").value;
    const file = document.getElementById("resumeFile").files[0];

    if (!title || !file) {
        alert("Please enter resume title and select PDF.");
        return;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", "portfolio_upload");

    try {

        const response = await fetch(
            "https://api.cloudinary.com/v1_1/eycvadb8/raw/upload",
            {
                method: "POST",
                body: formData
            }
        );

       const data = await response.json();

await setDoc(doc(db, "resume", "current"), {
    title: title,
    pdfUrl: data.secure_url,
    uploadedAt: new Date().toISOString()
});

console.log(data.secure_url);

alert("Resume Uploaded & Saved Successfully!");

    } catch (error) {

        console.error(error);

        alert("Upload Failed");

    }

}
async function loadResume() {

    const resumeList = document.getElementById("resumeList");

    const docRef = doc(db, "resume", "current");

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {

        const data = docSnap.data();

        resumeList.innerHTML = `
            <p><strong>${data.title}</strong></p>

            <div class="resume-actions">

                <a href="${data.pdfUrl}" target="_blank" class="view-btn">
                    👁 View Resume
                </a>

                <button id="deleteResumeBtn" class="delete-btn">
                    🗑 Delete Resume
                </button>

            </div>
        `;
    } else {

        resumeList.innerHTML = "No Resume Uploaded";
        const deleteBtn = document.getElementById("deleteResumeBtn");

        deleteBtn.addEventListener("click", async () => {

            const confirmDelete = confirm("Are you sure you want to delete this resume?");

            if (!confirmDelete) return;

            await deleteDoc(doc(db, "resume", "current"));

            alert("Resume Deleted Successfully!");

            loadResume();

        });

    }

}
loadResume();