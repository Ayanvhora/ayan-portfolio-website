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

const projectLink =
    document.getElementById("projectLink");

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
// ADD PROJECT
// ==========================================

uploadProjectBtn.addEventListener(
    "click",
    async () => {

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

        const link =
            projectLink.value.trim();

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

                    projectLink:
                        link,

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

            projectLink.value = "";


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
// EDIT PROJECT FORM
// ==========================================

function showEditProjectForm(project) {

    const modal =
        document.createElement("div");

    modal.className =
        "project-modal";

    modal.innerHTML = `

        <div class="project-modal-content edit-project-modal">

            <button
                class="project-modal-close edit-close-btn">
                ✕
            </button>


            <h2>
                ✏️ Edit Project
            </h2>


            <!-- Current Image -->

            <label>
                Current Project Image
            </label>

            <img
                src="${project.imageUrl}"
                class="project-modal-image"
                alt="${project.title}"
            >


            <!-- Change Image -->

            <label>
                Change Project Image
            </label>

            <input
                type="file"
                id="editProjectImage"
                accept=".jpg,.jpeg,.png,.webp"
            >


            <!-- Title -->

            <label>
                Project Title
            </label>

            <input
                type="text"
                id="editProjectTitle"
                value="${project.title || ""}"
            >


            <!-- Description -->

            <label>
                Project Description
            </label>

            <textarea
                id="editProjectDescription"
                rows="6"
            >${project.description || ""}</textarea>


            <!-- Technologies -->

            <label>
                Technologies Used
            </label>

            <input
                type="text"
                id="editProjectTechnologies"
                value="${project.technologies || ""}"
            >


            <!-- Existing Files -->

            <label>
                Existing Project Files
            </label>

            <div
                id="existingProjectFiles"
                class="existing-project-files"
            >

                ${
                    project.files &&
                    project.files.length > 0

                    ?

                    project.files.map(
                        (file, index) => `

                            <div
                                class="existing-file-item"
                            >

                                <span>
                                    📄 ${file.name}
                                </span>

                            </div>

                        `
                    ).join("")

                    :

                    `<p>No files uploaded.</p>`
                }

            </div>


            <!-- Add New Files -->

            <label>
                Add New Project Files
            </label>

            <input
                type="file"
                id="editProjectFiles"
                multiple
                accept=".pdf,.xlsx,.xls,.doc,.docx,.py,.ipynb,.csv,.txt"
            >


            <small>
                You can select multiple files.
            </small>


            <!-- Summary -->

            <label>
                Project Summary
            </label>

            <textarea
                id="editProjectSummary"
                rows="8"
            >${project.summary || ""}</textarea>


            <!-- Project Link -->

            <label>
                Project Link
            </label>

            <input
                type="url"
                id="editProjectLink"
                value="${project.projectLink || ""}"
                placeholder="https://github.com/..."
            >


            <!-- Buttons -->

            <div class="edit-project-actions">

                <button
                    id="saveProjectChanges"
                    class="save-btn"
                >
                    💾 Save Changes
                </button>


                <button
                    id="cancelProjectEdit"
                    class="cancel-btn"
                >
                    ❌ Cancel
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    // ==================================
    // CLOSE
    // ==================================

    const closeBtn =
        modal.querySelector(
            ".edit-close-btn"
        );


    closeBtn.addEventListener(
        "click",
        () => {

            modal.remove();

        }
    );


    // ==================================
    // CANCEL
    // ==================================

    const cancelBtn =
        modal.querySelector(
            "#cancelProjectEdit"
        );


    cancelBtn.addEventListener(
        "click",
        () => {

            modal.remove();

        }
    );


    // ==================================
    // SAVE
    // ==================================

    const saveBtn =
        modal.querySelector(
            "#saveProjectChanges"
        );


    saveBtn.addEventListener(
        "click",
        async () => {

            await saveProjectChanges(
                project,
                modal
            );

        }
    );


    // ==================================
    // CLICK OUTSIDE
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