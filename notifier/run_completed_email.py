from pathlib import Path

def statusColors(status: str) -> dict:
    if status.upper() == "SUCCESS":
        return {
            "header_color": "#16a34a",  # green
            "status_color": "#16a34a",
        }
    else:
        return {
            "header_color": "#dc2626",  # red
            "status_color": "#dc2626",
        }
    
def normalizeExitFlag(exitflag) -> str:
    if exitflag in (0, "0", "SUCCESS"):
        return "SUCCESS"
    return "FAILED"

def renderHtmlBody(run_id:int, status:str,end_time:str):
    template = Path("run_completed_email.html").read_text()    
    colors = statusColors(status)

    html_body = template.format(
        run_id=run_id,
        exit_flag=status,
        end_time = end_time,
        run_url=f"http://localhost:5173/dashboard/runs/{run_id}",
        header_color=colors["header_color"],
        status_color=colors["status_color"],
    )

    return html_body