import { useEffect, useState } from "react";
import { Table, Spinner } from "react-bootstrap";
import { fetchRunInfo } from "../api";

export default function RunInfo({ runId, token }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    useEffect(() => {
        let cancelled = false;

        if (!runId || !token) {
            setData([]);
            return;
        }

        async function loadRunInfo() {
            setLoading(true);
            try {
                const result = await fetchRunInfo(runId, token);
                if (!cancelled) {
                    setData(result);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error(err);
                    setData([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadRunInfo();

        return () => {
            cancelled = true;
        };
    }, [runId, token]);

    if (loading) {
        return (
            <div className="text-center my-3">
                <Spinner animation="border" size="sm" />
            </div>
        );
    }

    return (
        <Table striped bordered hover size="sm" responsive>
            <thead>
                <tr>                    
                    <th>Property</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={3} className="text-center text-muted">
                            No information available
                        </td>
                    </tr>
                ) : (
                    data.map((info) => (
                        <tr key={info.id}>                            
                            <td>{info.property}</td>
                            <td>{info.value}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </Table>
    );
}
