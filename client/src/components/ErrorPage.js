import { useRouteError} from "react-router-dom";

function ErrorPage(){
    const error = useRouteError();
    console.error(error);

    return (
        <main>
            <h1>404</h1>
            <h2>Whoops! Something went wrong!</h2>
        </main>
    )
}

export default ErrorPage