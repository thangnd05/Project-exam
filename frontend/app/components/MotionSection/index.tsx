'use client';

import {motion} from 'framer-motion';
import type {Variants} from 'framer-motion';

const defaultVariants: Variants = {
  hidden: {opacity: 0, y: 32},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.7, ease: [0.22, 1, 0.36, 1]},
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

type MotionItemProps = {
  children?: React.ReactNode;
  className?: string;
  variants?: Variants;
  [key: string]: any;
};

export const MotionItem = ({
  children,
  className,
  variants = defaultVariants,
  ...rest
}: MotionItemProps) => (
  <motion.div className={className} variants={variants} {...rest}>
    {children}
  </motion.div>
);

type MotionSectionProps = {
  children?: React.ReactNode;
  className?: string;
  as?: any;
  amount?: number;
  once?: boolean;
  stagger?: boolean;
  [key: string]: any;
};

const MotionSection = ({
  children,
  className,
  as: Component = motion.section,
  amount = 0.2,
  once = true,
  stagger = false,
  ...rest
}: MotionSectionProps) => {
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{once, amount}}
      variants={stagger ? staggerContainer : defaultVariants}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default MotionSection;
