import { Link, useNavigate } from "react-router-dom";
import { User, Building2, GraduationCap } from "lucide-react";

const options = [
  {
    to: "/auth/signup/user",
    icon: User,
    title: "Normal User",
    desc: "Browse and book hotels, sports facilities, gardens, and stays. Instant access.",
  },
  {
    to: "/auth/signup/teacher",
    icon: GraduationCap,
    title: "University Teacher / Official",
    desc: "Sign up with your @unideb.hu or @mailbox.unideb.hu email to get free, instant booking of seminar rooms and lecture halls.",
  },
  {
    to: "/auth/signup/institution",
    icon: Building2,
    title: "Institution",
    desc: "Register your hotel, university, sports facility, garden or stays. Requires Super Admin approval.",
  },
];

const Signup = () => {
  const navigate = useNavigate();
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold text-center mb-2">Create your account</h1>
      <p className="text-center text-muted-foreground mb-10">
        Choose how you'd like to join ReserveHub.
      </p>
      <div className="grid gap-4">
        {options.map((o) => (
          <button
            key={o.to}
            onClick={() => navigate(o.to)}
            className="flex items-start gap-4 text-left bg-card border rounded-xl p-6 hover:border-primary/40 hover:shadow-lg transition-all"
          >
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <o.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">{o.title}</h3>
              <p className="text-sm text-muted-foreground">{o.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground mt-8">
        Already have an account?{" "}
        <Link to="/auth/login" className="text-primary font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default Signup;
