import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface AuditLog {
    id: string
    action: string
    details: string | null
    userId: string
    createdAt: Date
    user?: {
        email: string
    }
}

interface Props {
    logs: AuditLog[]
}

export function AuditLogTable({ logs }: Props) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableCaption>A list of recent system activities.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Timestamp</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="font-medium">
                                {log.user?.email || log.userId}
                            </TableCell>
                            <TableCell>
                                <Badge variant={log.action === "SIGN_UP" ? "outline" : "default"}>
                                    {log.action}
                                </Badge>
                            </TableCell>
                            <TableCell>{log.details}</TableCell>
                            <TableCell className="text-right">
                                {new Date(log.createdAt).toLocaleString()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
