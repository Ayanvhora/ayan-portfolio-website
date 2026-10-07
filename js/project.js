import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ==========================================
// PROJECT ELEMENTS
// ==========================================

const projectImage =
    document.getElementById("projectImage");

const projectTitle =
    document.getElementById("projectTitle");

const projectDescription =
    document.getElementById("projectDescription");

const projectTechnologies =
    document.getElementById("projectTechnologies");

const projectFiles =
    document.getElementById("projectFiles");

const projectSummary =
    document.getElementById("projectSummary");

const projectLinksContainer =
    document.getElementById("projectLinksContainer");

const addProjectLinkBtn =
    document.getElementById("addProjectLinkBtn");

const uploadProjectBtn =
    document.getElementById("uploadProjectBtn");

const projectList =
    document.getElementById("projectList");


// ==========================================
// CLOUDINARY UPLOAD
// ==========================================

async function uploadToCloudinary(file, type = "file") {

    const formData = new FormData();

    formData.append("file", file);
    formData.append(
        "upload_preset",
        "portfolio_upload"
    );


    let uploadUrl;


    if (type === "image") {

        uploadUrl =
            "https://api.cloudinary.com/v1_1/eycvadb8/image/upload";

    } else {

        uploadUrl =
            "https://api.cloudinary.com/v1_1/eycvadb8/raw/upload";

    }


    const response = await fetch(
        uploadUrl,
        {
            method: "POST",
            body: formData
        }
    );


    const data = await response.json();


    console.log(
        "Cloudinary Response:",
        data
    );


    if (
        !response.ok ||
        !data.secure_url
    ) {

        throw new Error(
            data.error?.message ||
            "Cloudinary upload failed"
        );

    }


    return data;

}

// ==========================================
// MULTIPLE PROJECT LINKS
// ==========================================

function addProjectLinkRow(name = "", url = "") {

    const row = document.createElement("div");

    row.className = "project-link-row";

    row.innerHTML = `
        <input
            type="text"
            class="project-link-name"
            placeholder="Link Name e.g. GitHub Repository"
            value="${name.replace(/"/g, "&quot;")}">

        <input
            type="url"
            class="project-link-url"
            placeholder="https://..."
            value="${url.replace(/"/g, "&quot;")}">

        <button
            type="button"
            class="remove-project-link"
            title="Remove Link">
            🗑
        </button>
    `;

    row.querySelector(".remove-project-link")
        .addEventListener("click", () => {

            row.remove();

        });

    projectLinksContainer.appendChild(row);
}


// Add Another Link
addProjectLinkBtn.addEventListener("click", () => {

    addProjectLinkRow();

});


// Get all links
function getProjectLinks() {

    const rows =
        projectLinksContainer.querySelectorAll(
            ".project-link-row"
        );

    const links = [];

    rows.forEach(row => {

        const name =
            row.querySelector(
                ".project-link-name"
            ).value.trim();

        const url =
            row.querySelector(
                ".project-link-url"
            ).value.trim();

        if (name && url) {

            links.push({
                name: name,
                url: url
            });

        }

    });

    return links;
}
// ==========================================
// ADD PROJECT
// ==========================================

uploadProjectBtn.addEventListener(
    "click",
    async () => {
                // ==================================
        // CHECK EDIT MODE
        // ==================================

        if (editingProjectId) {

            await updateExistingProject();

            return;
        }

        const image =
            projectImage.files[0];

        const title =
            projectTitle.value.trim();

        const description =
            projectDescription.value.trim();

        const technologies =
            projectTechnologies.value.trim();

        const summary =
            projectSummary.value.trim();

        const projectLinks =
            getProjectLinks();

        const files =
            Array.from(projectFiles.files);


        // ==================================
        // VALIDATION
        // ==================================

        if (!image) {

            alert(
                "Please select project image."
            );

            return;

        }


        if (!title) {

            alert(
                "Please enter project title."
            );

            return;

        }


        if (!description) {

            alert(
                "Please enter project description."
            );

            return;

        }


        if (!technologies) {

            alert(
                "Please enter technologies used."
            );

            return;

        }


        if (!summary) {

            alert(
                "Please enter project summary."
            );

            return;

        }


        // ==================================
        // DISABLE BUTTON
        // ==================================

        uploadProjectBtn.disabled = true;

        uploadProjectBtn.innerText =
            "Uploading Project...";


        try {

            // ==============================
            // IMAGE UPLOAD
            // ==============================

            const imageData =
                await uploadToCloudinary(
                    image,
                    "image"
                );


            // ==============================
            // PROJECT FILES
            // ==============================

            const uploadedFiles = [];


            for (const file of files) {

                const fileData =
                    await uploadToCloudinary(
                        file,
                        "file"
                    );


                uploadedFiles.push({

                    name: file.name,

                    url: fileData.secure_url,

                    publicId:
                        fileData.public_id,

                    resourceType:
                        fileData.resource_type

                });

            }


            // ==============================
            // EXISTING PROJECTS
            // ==============================

            const existingProjects =
                await getDocs(
                    collection(
                        db,
                        "projects"
                    )
                );


            const projectOrder =
                existingProjects.size + 1;


            // ==============================
            // SAVE PROJECT
            // ==============================

            await addDoc(
                collection(
                    db,
                    "projects"
                ),
                {

                    title: title,

                    imageUrl:
                        imageData.secure_url,

                    imagePublicId:
                        imageData.public_id,

                    description:
                        description,

                    technologies:
                        technologies,

                    files:
                        uploadedFiles,

                    summary:
                        summary,

                    projectLinks:
                        projectLinks,

                    order:
                        projectOrder,

                    createdAt:
                        serverTimestamp()

                }
            );


            // ==============================
            // SUCCESS
            // ==============================

            alert(
                "Project Uploaded & Saved Successfully! 🎉"
            );


            // CLEAR FORM

            projectImage.value = "";

            projectTitle.value = "";

            projectDescription.value = "";

            projectTechnologies.value = "";

            projectFiles.value = "";

            projectSummary.value = "";

            projectLinksContainer.innerHTML = "";

            addProjectLinkRow();


            // RELOAD

            await loadProjects();


        } catch (error) {

            console.error(
                "Project Upload Error:",
                error
            );


            alert(
                "Project Upload Failed!\n\n" +
                error.message
            );


        } finally {

            uploadProjectBtn.disabled =
                false;

            uploadProjectBtn.innerText =
                "➕ Add Project";

        }

    }
);
// ==========================================
// UPDATE EXISTING PROJECT
// ==========================================

async function updateExistingProject() {

    if (!editingProjectId || !editingProject) {
        return;
    }

    const title =
        projectTitle.value.trim();

    const description =
        projectDescription.value.trim();

    const technologies =
        projectTechnologies.value.trim();

    const summary =
        projectSummary.value.trim();

    const projectLinks =
        getProjectLinks();

    const newImage =
        projectImage.files[0];

    const newFiles =
        Array.from(projectFiles.files);


    // ==================================
    // VALIDATION
    // ==================================

    if (!title) {
        alert("Please enter project title.");
        return;
    }

    if (!description) {
        alert("Please enter project description.");
        return;
    }

    if (!technologies) {
        alert("Please enter technologies used.");
        return;
    }

    if (!summary) {
        alert("Please enter project summary.");
        return;
    }


    try {

        uploadProjectBtn.disabled = true;

        uploadProjectBtn.innerText =
            "Updating Project...";


        // ==================================
        // KEEP OLD IMAGE
        // ==================================

        let imageUrl =
            editingProject.imageUrl || "";

        let imagePublicId =
            editingProject.imagePublicId || "";


        // ==================================
        // NEW IMAGE IF SELECTED
        // ==================================

        if (newImage) {

            const imageData =
                await uploadToCloudinary(
                    newImage,
                    "image"
                );

            imageUrl =
                imageData.secure_url;

            imagePublicId =
                imageData.public_id;
        }


        // ==================================
        // KEEP OLD FILES
        // ==================================

        let updatedFiles = [
            ...(editingProject.files || [])
        ];


        // ==================================
        // ADD NEW FILES
        // ==================================

        for (const file of newFiles) {

            const fileData =
                await uploadToCloudinary(
                    file,
                    "file"
                );

            updatedFiles.push({

                name:
                    file.name,

                url:
                    fileData.secure_url,

                publicId:
                    fileData.public_id,

                resourceType:
                    fileData.resource_type

            });

        }


        // ==================================
        // UPDATE FIRESTORE
        // ==================================

        await updateDoc(

            doc(
                db,
                "projects",
                editingProjectId
            ),

            {

                title:
                    title,

                description:
                    description,

                technologies:
                    technologies,

                summary:
                    summary,

                imageUrl:
                    imageUrl,

                imagePublicId:
                    imagePublicId,

                files:
                    updatedFiles,

                projectLinks:
                    projectLinks

            }

        );


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Project Updated Successfully! 🎉"
        );


        // ==================================
        // RESET FORM
        // ==================================

        projectImage.value = "";

        projectTitle.value = "";

        projectDescription.value = "";

        projectTechnologies.value = "";

        projectFiles.value = "";

        projectSummary.value = "";

        projectLinksContainer.innerHTML = "";

        addProjectLinkRow();


        // ==================================
        // EXIT EDIT MODE
        // ==================================

        editingProjectId = null;

        editingProject = null;


        // Change button back
        uploadProjectBtn.innerText =
            "➕ Add Project";


        // Reload project list
        await loadProjects();


    } catch (error) {

        console.error(
            "Project Update Error:",
            error
        );

        alert(
            "Project Update Failed!\n\n" +
            error.message
        );

    } finally {

        uploadProjectBtn.disabled =
            false;

        if (editingProjectId) {

            uploadProjectBtn.innerText =
                "💾 Update Project";

        } else {

            uploadProjectBtn.innerText =
                "➕ Add Project";

        }

    }

}

// ==========================================
// LOAD PROJECTS
// ==========================================

async function loadProjects() {

    projectList.innerHTML =
        "Loading Projects...";


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "projects"
                )
            );
            console.log("🔥 Firebase Project Documents:", snapshot.size);
            console.log("🔥 Firebase Projects:", snapshot.docs.map(doc => ({
                id: doc.id,
                data: doc.data()
            })));


        if (snapshot.empty) {

            projectList.innerHTML =
                "No Project Added";

            return;

        }


        const projects = [];


        snapshot.forEach(
            (docItem) => {

                projects.push({

                    id:
                        docItem.id,

                    ...docItem.data()

                });

            }
        );


        // ==================================
        // SORT PROJECTS
        // ==================================

        projects.sort(
            (a, b) => {

                return (
                    (Number(a.order) || 999999)
                    -
                    (Number(b.order) || 999999)
                );

            }
        );


        projectList.innerHTML = "";


        // ==================================
        // DISPLAY PROJECTS
        // ==================================

        projects.forEach(
            (project, index) => {

                projectList.innerHTML += `

                    <div
                        class="project-card"
                    >

                        <img
                            src="${project.imageUrl}"
                            alt="${project.title}"
                            class="project-image"
                        >


                        <h3>
                            ${project.title}
                        </h3>


                        <p>
                            ${project.description}
                        </p>


                        <p>

                            <strong>
                                Technologies:
                            </strong>

                            ${project.technologies}

                        </p>


                        <div
                            class="project-actions"
                        >

                            <button
                                class="up-btn"
                                data-id="${project.id}"
                                ${index === 0
                                    ? "disabled"
                                    : ""}
                            >
                                ⬆ Up
                            </button>


                            <button
                                class="down-btn"
                                data-id="${project.id}"
                                ${index === projects.length - 1
                                    ? "disabled"
                                    : ""}
                            >
                                ⬇ Down
                            </button>


                            <button
                                class="view-btn view-project-btn"
                                data-id="${project.id}"
                            >
                                👁 View Project
                            </button>
                            <button
                                class="edit-btn"
                                data-id="${project.id}"
                            >
                                ✏️ Edit Project
                            </button>


                            <button
                                class="delete-btn"
                                data-id="${project.id}"
                            >
                                🗑 Delete
                            </button>

                        </div>

                    </div>

                `;

            }
        );


        // ==================================
        // VIEW BUTTONS
        // ==================================

        const viewButtons =
            document.querySelectorAll(
                ".view-project-btn"
            );


        viewButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const projectId =
                            button.getAttribute(
                                "data-id"
                            );


                        const selectedProject =
                            projects.find(
                                project =>
                                    project.id ===
                                    projectId
                            );


                        if (
                            !selectedProject
                        ) {

                            return;

                        }


                        showProjectDetails(
                            selectedProject
                        );

                    }
                );

            }
        );


        // ==================================
        // UP BUTTONS
        // ==================================

        const upButtons =
            document.querySelectorAll(
                ".up-btn"
            );


        upButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.getAttribute(
                                "data-id"
                            );


                        await moveProject(
                            id,
                            "up"
                        );

                    }
                );

            }
        );


        // ==================================
        // DOWN BUTTONS
        // ==================================

        const downButtons =
            document.querySelectorAll(
                ".down-btn"
            );


        downButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.getAttribute(
                                "data-id"
                            );


                        await moveProject(
                            id,
                            "down"
                        );

                    }
                );

            }
        );


        // ==================================
        // DELETE BUTTONS
        // ==================================

        const deleteButtons =
            document.querySelectorAll(
                ".delete-btn"
            );


        deleteButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.getAttribute(
                                "data-id"
                            );


                        const confirmDelete =
                            confirm(
                                "Are you sure you want to delete this project?"
                            );


                        if (
                            !confirmDelete
                        ) {

                            return;

                        }


                        try {

                            await deleteDoc(
                                doc(
                                    db,
                                    "projects",
                                    id
                                )
                            );


                            alert(
                                "Project Deleted Successfully!"
                            );


                            await fixProjectOrder();

                            await loadProjects();


                        } catch (error) {

                            console.error(
                                "Delete Error:",
                                error
                            );


                            alert(
                                "Delete failed!"
                            );

                        }

                    }
                );

            }
        );
                // ==================================
        // EDIT PROJECT BUTTONS
        // ==================================

        const editButtons =
            document.querySelectorAll(".edit-btn");

        editButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const projectId =
                            button.getAttribute("data-id");

                        const selectedProject =
                            projects.find(
                                project =>
                                    project.id === projectId
                            );

                        if (!selectedProject) {
                            return;
                        }

                        showEditProjectForm(
                            selectedProject
                        );

                    }
                );

            }
        );


    } catch (error) {

        console.error(
            "Load Projects Error:",
            error
        );


        projectList.innerHTML =
            "Unable to load projects.";

    }

}


// ==========================================
// MOVE PROJECT UP / DOWN
// ==========================================

async function moveProject(
    id,
    direction
) {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "projects"
                )
            );


        const projects = [];


        snapshot.forEach(
            (item) => {

                projects.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );


        // SORT

        projects.sort(
            (a, b) => {

                return (
                    (Number(a.order) || 999999)
                    -
                    (Number(b.order) || 999999)
                );

            }
        );


        const currentIndex =
            projects.findIndex(
                project =>
                    project.id === id
            );


        if (
            currentIndex === -1
        ) {

            return;

        }


        let newIndex;


        if (
            direction === "up"
        ) {

            newIndex =
                currentIndex - 1;

        } else {

            newIndex =
                currentIndex + 1;

        }


        // TOP / BOTTOM

        if (
            newIndex < 0 ||
            newIndex >= projects.length
        ) {

            return;

        }


        // SWAP

        const temp =
            projects[currentIndex];


        projects[currentIndex] =
            projects[newIndex];


        projects[newIndex] =
            temp;


        // SAVE NEW ORDER

        for (
            let i = 0;
            i < projects.length;
            i++
        ) {

            await updateDoc(
                doc(
                    db,
                    "projects",
                    projects[i].id
                ),
                {

                    order:
                        i + 1

                }
            );

        }


        await loadProjects();


    } catch (error) {

        console.error(
            "Move Project Error:",
            error
        );


        alert(
            "Move failed. Check Console."
        );

    }

}


// ==========================================
// FIX PROJECT ORDER AFTER DELETE
// ==========================================

async function fixProjectOrder() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "projects"
            )
        );


    const projects = [];


    snapshot.forEach(
        (item) => {

            projects.push({

                id:
                    item.id,

                ...item.data()

            });

        }
    );


    projects.sort(
        (a, b) => {

            return (
                (Number(a.order) || 999999)
                -
                (Number(b.order) || 999999)
            );

        }
    );


    for (
        let i = 0;
        i < projects.length;
        i++
    ) {

        await updateDoc(
            doc(
                db,
                "projects",
                projects[i].id
            ),
            {

                order:
                    i + 1

            }
        );

    }

}
// ==========================================
// EDIT PROJECT IN MAIN ADD PROJECT FORM
// ==========================================

let editingProjectId = null;
let editingProject = null;

// ==========================================
// EDIT PROJECT IN MAIN ADD PROJECT FORM
// ==========================================

function showEditProjectForm(project) {

    editingProjectId = project.id;

    // Make a safe copy
    editingProject = {
        ...project,
        files: [...(project.files || [])]
    };


    // ==================================
    // FILL MAIN FORM
    // ==================================

    projectTitle.value =
        project.title || "";

    projectDescription.value =
        project.description || "";

    projectTechnologies.value =
        project.technologies || "";

    projectSummary.value =
        project.summary || "";


    // ==================================
    // LOAD PROJECT LINKS
    // ==================================

    projectLinksContainer.innerHTML = "";

    if (
        project.projectLinks &&
        project.projectLinks.length > 0
    ) {

        project.projectLinks.forEach(
            (link) => {

                addProjectLinkRow(
                    link.name || "",
                    link.url || ""
                );

            }
        );

    } else {

        addProjectLinkRow();

    }


    // ==================================
    // EXISTING PROJECT FILES
    // ==================================

    let existingFilesBox =
        document.getElementById(
            "existingProjectFiles"
        );


    if (!existingFilesBox) {

        existingFilesBox =
            document.createElement("div");

        existingFilesBox.id =
            "existingProjectFiles";

        existingFilesBox.className =
            "existing-project-files";


        // Put before file upload input
        projectFiles.parentElement.insertBefore(
            existingFilesBox,
            projectFiles
        );

    }


    // ==================================
    // SHOW EXISTING FILES
    // ==================================

    renderExistingProjectFiles(
        existingFilesBox
    );


    // ==================================
    // UPDATE BUTTON
    // ==================================

    uploadProjectBtn.innerText =
        "💾 Update Project";


    // ==================================
    // SCROLL TO FORM
    // ==================================

    uploadProjectBtn.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// ==========================================
// SHOW EXISTING PROJECT FILES
// ==========================================

function renderExistingProjectFiles(
    container
) {

    const files =
        editingProject.files || [];


    if (files.length === 0) {

        container.innerHTML = `
            <label>
                Existing Project Files
            </label>

            <p>
                No existing project files.
            </p>
        `;

        return;
    }


    container.innerHTML = `

        <label>
            Existing Project Files
        </label>

        <div class="existing-project-files-list">

            ${
                files.map(
                    (file, index) => `

                        <div
                            class="existing-file-item"
                            style="
                                display:flex;
                                align-items:center;
                                justify-content:space-between;
                                gap:10px;
                                margin-bottom:10px;
                                padding:8px;
                                border:1px solid #ddd;
                                border-radius:8px;
                            "
                        >

                            <span>
                                📄 ${file.name}
                            </span>

                            <button
                                type="button"
                                class="remove-existing-file-btn"
                                data-index="${index}"
                                style="
                                    background:#dc2626;
                                    color:white;
                                    border:none;
                                    padding:7px 12px;
                                    border-radius:6px;
                                    cursor:pointer;
                                "
                            >
                                🗑 Remove
                            </button>

                        </div>

                    `
                ).join("")
            }

        </div>
    `;


    // ==================================
    // REMOVE BUTTON
    // ==================================

    const removeButtons =
        container.querySelectorAll(
            ".remove-existing-file-btn"
        );


    removeButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.getAttribute(
                                "data-index"
                            )
                        );


                    const fileName =
                        editingProject.files[index]
                            ?.name ||
                        "this file";


                    const confirmRemove =
                        confirm(
                            `Remove "${fileName}" from this project?`
                        );


                    if (!confirmRemove) {
                        return;
                    }


                    // Remove file
                    editingProject.files.splice(
                        index,
                        1
                    );


                    // Refresh list
                    renderExistingProjectFiles(
                        container
                    );

                }
            );

        }
    );

}



// ==========================================
// VIEW PROJECT DETAILS
// ==========================================

function showProjectDetails(project) {

    let filesHTML = "";


    // ==================================
    // PROJECT FILES
    // ==================================

    if (
        project.files &&
        project.files.length > 0
    ) {

        filesHTML =
            project.files.map(
                (file) => {

                    const fileName =
                        file.name.toLowerCase();


                    let viewButton = "";


                    // EXCEL

                    if (
                        fileName.endsWith(".xlsx") ||
                        fileName.endsWith(".xls")
                    ) {

                        const officeViewer =
                            "https://view.officeapps.live.com/op/view.aspx?src="
                            +
                            encodeURIComponent(
                                file.url
                            );


                        viewButton = `

                            <a
                                href="${officeViewer}"
                                target="_blank"
                                class="file-view-btn"
                            >
                                👁 View Excel
                            </a>

                        `;

                    }


                    // WORD

                    else if (
                        fileName.endsWith(".doc") ||
                        fileName.endsWith(".docx")
                    ) {

                        const officeViewer =
                            "https://view.officeapps.live.com/op/view.aspx?src="
                            +
                            encodeURIComponent(
                                file.url
                            );


                        viewButton = `

                            <a
                                href="${officeViewer}"
                                target="_blank"
                                class="file-view-btn"
                            >
                                👁 View Word
                            </a>

                        `;

                    }


                    // PDF

                    else if (
                        fileName.endsWith(".pdf")
                    ) {

                        viewButton = `

                            <a
                                href="${file.url}"
                                target="_blank"
                                class="file-view-btn"
                            >
                                👁 View PDF
                            </a>

                        `;

                    }


                    // OTHER FILES

                    else {

                        viewButton = `

                            <a
                                href="${file.url}"
                                target="_blank"
                                class="file-view-btn"
                            >
                                👁 Open File
                            </a>

                        `;

                    }


                    return `

                        <div
                            class="project-file"
                        >

                            <span>
                                📄 ${file.name}
                            </span>


                            <div
                                class="file-buttons"
                            >

                                ${viewButton}


                                <a
                                    href="${file.url}"
                                    download
                                    class="file-download-btn"
                                >
                                    ⬇ Download
                                </a>

                            </div>

                        </div>

                    `;

                }
            ).join("");

    } else {

        filesHTML = `

            <p class="no-files">
                No project files uploaded.
            </p>

        `;

    }


    // ==================================
    // CREATE MODAL
    // ==================================

    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "project-modal";


    modal.innerHTML = `

        <div
            class="project-modal-content"
        >

            <button
                class="project-modal-close"
            >
                ✕
            </button>


            <img
                src="${project.imageUrl}"
                class="project-modal-image"
                alt="${project.title}"
            >


            <h2>
                ${project.title}
            </h2>


            <h3>
                📄 Project Description
            </h3>


            <p>
                ${project.description}
            </p>


            <h3>
                🛠️ Technologies Used
            </h3>


            <p>
                ${project.technologies}
            </p>


            <h3>
                📁 Project Files
            </h3>


            <div
                class="project-files"
            >

                ${filesHTML}

            </div>


            <h3>
                📋 Project Summary
            </h3>


            <p>
                ${project.summary}
            </p>


            ${
                project.projectLink
                ?
                `

                    <a
                        href="${project.projectLink}"
                        target="_blank"
                        class="github-project-btn"
                    >
                        🔗 View Project Link
                    </a>

                `
                :
                ""
            }


        </div>

    `;


    document.body.appendChild(
        modal
    );


    // ==================================
    // CLOSE BUTTON
    // ==================================

    const closeButton =
        modal.querySelector(
            ".project-modal-close"
        );


    closeButton.addEventListener(
        "click",
        () => {

            modal.remove();

        }
    );


    // ==================================
    // CLICK OUTSIDE MODAL
    // ==================================

    modal.addEventListener(
        "click",
        (event) => {

            if (
                event.target === modal
            ) {

                modal.remove();

            }

        }
    );

}


// ==========================================
// INITIAL LOAD
// ==========================================

loadProjects();