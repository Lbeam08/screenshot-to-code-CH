import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Input } from "./ui/input";
import toast from "react-hot-toast";
import { PICO_BACKEND_FORM_SECRET } from "../config";

const TermsOfServiceDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const [email, setEmail] = React.useState("");

  const onSubscribe = async () => {
    await fetch("https://backend.buildpicoapps.com/form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, secret: PICO_BACKEND_FORM_SECRET }),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="mb-2">
            输入您的电子邮件以开始使用
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mb-2">
          <Input
            placeholder="电子邮件"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </div>
        <div className="flex items-center space-x-2">
          <span>
            通过提供您的电子邮件，您同意不时接收产品更新，并接受{" "}
            <a
              href="https://a.picoapps.xyz/camera-write"
              target="_blank"
              className="underline"
            >
              服务条款
            </a>
            。 <br />
            <br />
            更喜欢在本地运行？这个项目是开源的。{" "}
            <a
              href="https://github.com/abi/screenshot-to-code"
              target="_blank"
              className="underline"
            >
              在 Github 上下载代码并开始。
            </a>
          </span>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction
            onClick={(e) => {
              if (!email.trim() || !email.trim().includes("@")) {
                e.preventDefault();
                toast.error("请输入您的电子邮件");
              } else {
                onSubscribe();
              }
            }}
          >
            同意
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TermsOfServiceDialog;
