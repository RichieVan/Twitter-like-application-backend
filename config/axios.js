import axios from "axios";

const imagesApi = axios.create({
    withCredentials: true,
    headers: {
        Authorization : `Bearer ${process.env.IMG_ACCESS}`
    }
})

export default imagesApi;